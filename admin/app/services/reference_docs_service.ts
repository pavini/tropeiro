import logger from '@adonisjs/core/services/logger'
import axios from 'axios'
import { createHash } from 'node:crypto'
import { createReadStream, createWriteStream } from 'node:fs'
import { mkdir, rename, rm, stat, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { REFERENCE_DOCS } from '../content/referencias.js'
import { aiServicesInstalled } from '../utils/ai_installed.js'
import { decodeHtml, htmlText, snapshotHtml } from '../utils/html_snapshot.js'
import type { ReferenceDoc, ReferenceDocStatus } from '../../types/fichas.js'

const DOWNLOAD_TIMEOUT_MS = 10 * 60_000

/**
 * Documentos oficiais em que as fichas se baseiam. O servidor baixa cada um da
 * fonte oficial, confere o sha256 e guarda em storage/referencias, para que a
 * pessoa possa abrir o original mesmo sem internet.
 */
export class ReferenceDocsService {
  private static running: Promise<void> | null = null

  private get dir() {
    return join(process.cwd(), 'storage', 'referencias')
  }

  private filePath(doc: ReferenceDoc) {
    return join(this.dir, `${doc.id}.${doc.format ?? 'pdf'}`)
  }

  private async isAvailable(doc: ReferenceDoc): Promise<boolean> {
    try {
      const size = (await stat(this.filePath(doc))).size
      return doc.format === 'html' ? size > 0 : size === doc.sizeBytes
    } catch {
      return false
    }
  }

  async status(): Promise<ReferenceDocStatus[]> {
    return Promise.all(
      REFERENCE_DOCS.map(async ({ sha256, ...doc }) => ({
        ...doc,
        available: await this.isAvailable({ sha256, ...doc }),
      }))
    )
  }

  /** Baixa o que falta. Chamadas simultâneas esperam a mesma execução. */
  ensureAll(): Promise<void> {
    if (!ReferenceDocsService.running) {
      ReferenceDocsService.running = this.downloadMissing().finally(() => {
        ReferenceDocsService.running = null
      })
    }
    return ReferenceDocsService.running
  }

  /**
   * Põe na base de conhecimento da IA os documentos já baixados que ela ainda
   * não tem (ou cuja leitura falhou), para as respostas citarem a página. Só
   * age com a IA e a base instaladas. Devolve quantos foram para a fila.
   */
  async queueForAi(): Promise<number> {
    if (!(await aiServicesInstalled())) return 0

    const app = (await import('@adonisjs/core/services/app')).default
    const { RagService } = await import('#services/rag_service')
    const { default: KbIngestState } = await import('#models/kb_ingest_state')
    const rag = await app.container.make(RagService)
    let queued = 0
    for (const doc of REFERENCE_DOCS) {
      if (!(await this.isAvailable(doc))) continue
      const path = this.filePath(doc)
      const state = await KbIngestState.findBy('file_path', path)
      if (state && state.state !== 'failed') continue
      const result = await rag.embedSingleFile(path)
      if (result.success) queued++
      else if (result.code !== 'inflight') {
        logger.warn(`[ReferenceDocs] ${doc.id} não foi para a IA: ${result.message}`)
      }
    }
    if (queued > 0) logger.info(`[ReferenceDocs] ${queued} documento(s) na fila da base da IA`)
    return queued
  }

  /**
   * Quantos documentos baixados a IA já leu e quantos falharam; null quando a
   * IA ou a base de conhecimento não estão instaladas.
   */
  async aiStatus(): Promise<{ total: number; ready: number; failed: number } | null> {
    if (!(await aiServicesInstalled())) return null
    const { default: KbIngestState } = await import('#models/kb_ingest_state')
    const paths: string[] = []
    for (const doc of REFERENCE_DOCS) {
      if (await this.isAvailable(doc)) paths.push(this.filePath(doc))
    }
    const rows = paths.length ? await KbIngestState.query().whereIn('file_path', paths) : []
    return {
      total: paths.length,
      ready: rows.filter((r) => r.state === 'indexed').length,
      failed: rows.filter((r) => r.state === 'failed').length,
    }
  }

  /** O documento guardado, ou null se ainda não foi baixado. */
  async open(id: string): Promise<{ stream: Readable; doc: ReferenceDoc; size: number } | null> {
    const doc = REFERENCE_DOCS.find((d) => d.id === id)
    if (!doc || !(await this.isAvailable(doc))) return null
    const path = this.filePath(doc)
    return { stream: createReadStream(path), doc, size: (await stat(path)).size }
  }

  private async downloadMissing(): Promise<void> {
    await mkdir(this.dir, { recursive: true })
    for (const doc of REFERENCE_DOCS) {
      if (await this.isAvailable(doc)) continue
      try {
        await this.download(doc)
        logger.info(`[ReferenceDocs] Documento baixado: ${doc.id}`)
      } catch (err) {
        // Sem internet é o caso comum; tenta de novo na próxima rodada.
        logger.warn(`[ReferenceDocs] Não foi possível baixar ${doc.id}: ${(err as Error).message}`)
      }
    }
  }

  private async download(doc: ReferenceDoc): Promise<void> {
    if (doc.format === 'html') return this.downloadPage(doc)
    const target = this.filePath(doc)
    const tmp = `${target}.tmp`
    const hash = createHash('sha256')
    try {
      const res = await axios.get(doc.url, { responseType: 'stream', timeout: DOWNLOAD_TIMEOUT_MS })
      res.data.on('data', (chunk: Buffer) => hash.update(chunk))
      await pipeline(res.data, createWriteStream(tmp))
      const digest = hash.digest('hex')
      if (digest !== doc.sha256) {
        throw new Error(`sha256 diferente do esperado (${digest}); a fonte pode ter mudado o arquivo`)
      }
      await rename(tmp, target)
    } finally {
      await rm(tmp, { force: true })
    }
  }

  /**
   * Norma publicada só como página: guarda uma cópia limpa, depois de conferir
   * que a página tem os trechos esperados (e não um aviso de bloqueio).
   */
  private async downloadPage(doc: ReferenceDoc): Promise<void> {
    const res = await axios.get<ArrayBuffer>(doc.url, {
      responseType: 'arraybuffer',
      timeout: DOWNLOAD_TIMEOUT_MS,
      headers: { 'User-Agent': 'Mozilla/5.0 (Tropeiro)' },
    })
    const html = decodeHtml(new Uint8Array(res.data), String(res.headers['content-type'] ?? ''))
    const text = htmlText(html)
    const missing = (doc.mustContain ?? []).filter((m) => !text.includes(m))
    if (missing.length) throw new Error(`a página não tem o esperado (${missing.join(' | ')})`)
    const date = new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
    const target = this.filePath(doc)
    await writeFile(`${target}.tmp`, snapshotHtml(html, { title: doc.title, url: doc.url, date }))
    await rename(`${target}.tmp`, target)
  }
}
