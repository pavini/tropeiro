import type { HttpContext } from '@adonisjs/core/http'
import logger from '@adonisjs/core/services/logger'
import { DrugReferenceService } from '#services/drug_reference_service'
import { ConditionService } from '#services/condition_service'
import { parseCompareIds } from '../../util/compare_ids.js'
import { situationsForIndications } from '../../util/conditions.js'
import { acaoParaInstalar, buscaDeRemedio, estadoDaBase, nomeNoBrasil, simplesPrimeiro } from '../utils/remedios.js'
import { FtnService } from '#services/ftn_service'
import { FTN_ID, monografiasCitadas, monografiasPorNome, type Monografia } from '../utils/ftn.js'
import type { DrugIngestStatus } from '../../types/drug_reference.js'

const RESULTADOS = 40

/**
 * Remédios na interface nova: busca pelo nome, bula, "por situação" e
 * comparação de interações. A base é a das bulas americanas (FDA), baixada
 * uma vez e consultada sem internet.
 */
export default class RemediosController {
  private get drugs() {
    return new DrugReferenceService()
  }

  private async base() {
    try {
      const status = await this.drugs.getIngestStatus()
      return { estado: estadoDaBase(status.phase, status.rowCount), rowCount: status.rowCount, progresso: progresso(status), erro: status.error ?? null }
    } catch (err) {
      logger.error(`[Remedios] falha ao ler a situação da base: ${(err as Error).message}`)
      return { estado: 'ausente' as const, rowCount: 0, progresso: null, erro: null }
    }
  }

  /** Nomes dos remédios escolhidos para comparar (vêm em ?comparar=1,2). */
  private async escolhidos(raw: string) {
    const ids = parseCompareIds(raw)
    if (ids.length === 0) return []
    const entries = await this.drugs.getInteractionsFor(ids).catch(() => [])
    return entries.map((e) => ({ id: e.id, name: e.brand_name ?? e.generic_name ?? `#${e.id}` }))
  }

  /** Monografias do FTN; espera o índice só alguns segundos, para a página não travar. */
  private async monografias(): Promise<Monografia[]> {
    const ftn = new FtnService()
    const timeout = new Promise<Monografia[]>((resolve) => setTimeout(() => resolve(ftn.prontas()), 3000))
    return Promise.race([ftn.monografias(), timeout]).catch(() => [])
  }

  async index({ inertia, request }: HttpContext) {
    const q = String(request.input('q', '')).trim().slice(0, 100)
    const base = await this.base()
    const busca = q ? buscaDeRemedio(q) : null
    let resultados: Awaited<ReturnType<DrugReferenceService['search']>> = []
    if (busca && base.rowCount > 0) {
      resultados = await this.drugs.search(busca.termo, { limit: RESULTADOS }).catch((err) => {
        logger.warn(`[Remedios] busca falhou: ${(err as Error).message}`)
        return []
      })
    }
    const ftn = q ? monografiasPorNome(q, await this.monografias()).map(resumo) : []
    return inertia.render('novo/remedios', {
      ...base,
      ftn,
      ftnId: FTN_ID,
      situacoes: new ConditionService().listConditions(),
      q,
      busca,
      resultados,
      comparar: await this.escolhidos(String(request.input('comparar', ''))),
      resultado: String(request.input('resultado', '')),
    })
  }

  async show({ inertia, params, request, response }: HttpContext) {
    const id = Number(params.id)
    if (!Number.isInteger(id) || id <= 0) return response.redirect().toPath('/remedios')
    const label = await this.drugs.find(id).catch(() => null)
    if (!label) return response.redirect().toPath('/remedios')
    const conditions = new ConditionService()
    const situacoes = situationsForIndications(label.indications, conditions.allConditions())
    const nome = nomeNoBrasil(label.generic_name)
    const [ftn] = nome ? monografiasCitadas(nome, await this.monografias(), 1) : []
    return inertia.render('novo/remedio', {
      label,
      situacoes,
      ftn: ftn ? resumo(ftn) : null,
      ftnId: FTN_ID,
      comparar: await this.escolhidos(String(request.input('comparar', ''))),
    })
  }

  async situacao({ inertia, params, request, response }: HttpContext) {
    const service = new ConditionService()
    const result = await service.drugsForSlug(String(params.slug), 50).catch(() => null)
    if (!result) return response.redirect().toPath('/remedios')
    const base = await this.base()
    return inertia.render('novo/remedios-situacao', {
      situacao: result.condition,
      remedios: simplesPrimeiro(result.drugs),
      instalada: base.rowCount > 0,
      comparar: await this.escolhidos(String(request.input('comparar', ''))),
    })
  }

  async comparar({ inertia, request }: HttpContext) {
    const ids = parseCompareIds(String(request.input('ids', '')))
    const remedios = ids.length ? await this.drugs.getInteractionsFor(ids).catch(() => []) : []
    return inertia.render('novo/remedios-comparar', { remedios })
  }

  /** Baixa a base, organiza o que já foi baixado ou recomeça depois de uma falha. */
  async instalar({ response }: HttpContext) {
    const { estado } = await this.base()
    const acao = acaoParaInstalar(estado)
    try {
      if (acao === 'baixar') await this.drugs.triggerDownload()
      else if (acao === 'organizar') await this.drugs.triggerIngestFromDisk()
      else if (acao === 'recomecar') {
        const result = await this.drugs.resetAndReingest()
        if (result.nothingDownloaded) await this.drugs.triggerDownload()
      }
      return response.redirect().toPath('/remedios')
    } catch (err) {
      logger.error(`[Remedios] falha ao instalar a base: ${(err as Error).message}`)
      return response.redirect().toPath('/remedios?resultado=erro')
    }
  }

  async remover({ response }: HttpContext) {
    const result = await this.drugs.uninstall().catch((err) => ({ success: false, message: (err as Error).message }))
    if (!result.success) logger.error(`[Remedios] falha ao remover a base: ${result.message}`)
    return response.redirect().toPath(`/remedios?resultado=${result.success ? 'removida' : 'erro'}`)
  }
}

/** Quanto falta, de 0 a 100, e o que está acontecendo; null quando nada está em andamento. */
function progresso(status: DrugIngestStatus): { percent: number | null; etapa: 'baixando' | 'organizando' } | null {
  if (status.phase === 'downloading') {
    const { partsDone, totalParts, bytesDownloaded, bytesTotal } = status.download
    const percent = bytesTotal ? (100 * (bytesDownloaded ?? 0)) / bytesTotal : totalParts ? (100 * partsDone) / totalParts : null
    return { percent: percent === null ? null : Math.min(100, Math.round(percent)), etapa: 'baixando' }
  }
  if (status.phase === 'ingesting') {
    const { records, expectedTotal, partsDone, totalParts } = status.ingest
    const percent = expectedTotal ? (100 * records) / expectedTotal : totalParts ? (100 * partsDone) / totalParts : null
    return { percent: percent === null ? null : Math.min(100, Math.round(percent)), etapa: 'organizando' }
  }
  return null
}

const resumo = (m: Monografia) => ({ nome: m.nome, pagina: m.pagina })
