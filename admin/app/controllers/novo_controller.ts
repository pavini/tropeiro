import { SystemService } from '#services/system_service'
import { LibrarySearchService } from '#services/library_search_service'
import { LibraryReaderService } from '#services/library_reader_service'
import { KitService } from '#services/kit_service'
import { DownloadService } from '#services/download_service'
import queueConfig from '#config/queue'
import { isWorkerAlive } from '../utils/worker_heartbeat.js'
import logger from '@adonisjs/core/services/logger'
import vine from '@vinejs/vine'
import { KITS } from '../../constants/kits.js'
import { SERVICE_NAMES } from '../../constants/service_names.js'
import { ReferenceDocsService } from '#services/reference_docs_service'
import { OllamaService } from '#services/ollama_service'
import { InstalledContentService } from '#services/installed_content_service'
import { DockerService } from '#services/docker_service'
import { MapService } from '#services/map_service'
import { mapTitle } from '../utils/installed_content.js'
import { localizeLabels } from '../utils/map_labels.js'
import { PlaceSearchService } from '#services/place_search_service'
import KVStore from '#models/kv_store'
import { FICHAS } from '../content/fichas.js'
import { searchFichas } from '../utils/fichas_search.js'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import { isDrugReferenceInstalled } from '../utils/drug_reference_installed.js'

/**
 * Interface nova do Tropeiro, servida em /novo enquanto convive com a clássica.
 * Usa os mesmos serviços e dados; só as telas são outras.
 */
const applyKitValidator = vine.compile(
  vine.object({ kit: vine.enum(KITS.map((k) => k.id)) })
)
const appActionValidator = vine.compile(
  vine.object({
    service: vine.string().trim().maxLength(100),
    action: vine.enum(['install', 'start', 'stop', 'restart'] as const),
  })
)
const removeContentValidator = vine.compile(
  vine.object({ kind: vine.enum(['book', 'map', 'model'] as const), id: vine.string().trim().minLength(1).maxLength(255) })
)

@inject()
export default class NovoController {
  constructor(
    private systemService: SystemService,
    private librarySearch: LibrarySearchService,
    private libraryReader: LibraryReaderService,
    private kits: KitService,
    private downloads: DownloadService,
    private ollama: OllamaService,
    private installed: InstalledContentService,
    private docker: DockerService,
    private maps: MapService
  ) {}

  async inicio({ inertia }: HttpContext) {
    return inertia.render('novo/inicio', await this.sharedProps())
  }

  async busca({ inertia, request }: HttpContext) {
    const q = String(request.input('q', '')).trim().slice(0, 200)
    const [shared, library] = await Promise.all([this.sharedProps(), this.librarySearch.search(q)])
    const fichas = searchFichas(FICHAS, q).map(({ slug, title, summary }) => ({ slug, title, summary }))
    return inertia.render('novo/busca', { ...shared, q, library, fichas })
  }

  /** Artigo da biblioteca lido dentro do Tropeiro: /novo/ler/<livro>/<página>. */
  async ler({ inertia, request, response }: HttpContext) {
    const q = String(request.input('q', '')).trim().slice(0, 200) || undefined
    const result = await this.libraryReader.read(this.rest(request.url(), '/novo/ler/'), q)
    if (result.kind === 'redirect') return response.redirect().toPath(result.to)
    if (result.kind !== 'article') response.status(result.kind === 'not_found' ? 404 : 503)
    return inertia.render('novo/ler', {
      q: q ?? '',
      status: result.kind,
      article: result.kind === 'article' ? { title: result.title, html: result.html } : null,
    })
  }

  /** Imagens e outros arquivos dos artigos, servidos pelo Tropeiro. */
  async arquivo({ request, response }: HttpContext) {
    const result = await this.libraryReader.asset(this.rest(request.url(), '/novo/arquivo/'))
    if (result.kind !== 'asset') return response.status(result.kind === 'not_found' ? 404 : 503).send('')
    response.header('Content-Type', result.contentType)
    if (result.length) response.header('Content-Length', result.length)
    response.header('Cache-Control', 'public, max-age=86400')
    response.header('X-Content-Type-Options', 'nosniff')
    // SVG pode carregar script; servido isolado, sem poder executar nada.
    response.header('Content-Security-Policy', "default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'; sandbox")
    return response.stream(result.stream)
  }

  /** Montagem do servidor por kits. */
  async montar({ inertia, request }: HttpContext) {
    return inertia.render('novo/montar', {
      kits: await this.kits.plans(),
      result: String(request.input('resultado', '')),
    })
  }

  async aplicarKit({ request, response }: HttpContext) {
    const { kit } = await request.validateUsing(applyKitValidator)
    try {
      const { started } = await this.kits.apply(kit)
      return response.redirect().toPath(`/novo/montar?resultado=${started > 0 ? 'iniciado' : 'nada'}`)
    } catch (err) {
      logger.error(`[NovoController] falha ao aplicar o kit ${kit}: ${(err as Error).message}`)
      return response.redirect().toPath('/novo/montar?resultado=erro')
    }
  }

  /** Downloads em andamento e se o worker que os processa está vivo. */
  async downloadStatus({}: HttpContext) {
    const [jobs, workerAlive] = await Promise.all([
      this.downloads.listDownloadJobs().catch(() => []),
      isWorkerAlive(queueConfig.connection),
    ])
    return { workerAlive, jobs }
  }

  /** O que está instalado no servidor, para ver e apagar. */
  async conteudo({ inertia, request }: HttpContext) {
    return inertia.render('novo/conteudo', {
      ...(await this.installed.list()),
      result: String(request.input('resultado', '')),
    })
  }

  async apagarConteudo({ request, response }: HttpContext) {
    const { kind, id } = await request.validateUsing(removeContentValidator)
    try {
      await this.installed.remove(kind, id)
      return response.redirect().toPath('/novo/conteudo?resultado=apagado')
    } catch (err) {
      logger.error(`[NovoController] falha ao apagar ${kind} ${id}: ${(err as Error).message}`)
      return response.redirect().toPath('/novo/conteudo?resultado=erro')
    }
  }

  /** Mapa offline, com os pontos marcados. */
  async mapa({ inertia }: HttpContext) {
    const [ready, regions] = await Promise.all([
      this.maps.ensureBaseAssets().catch(() => false),
      this.maps.listRegions().catch(() => ({ files: [] })),
    ])
    return inertia.render('novo/mapa', {
      ready,
      regions: regions.files.map((f) => mapTitle(f.name)),
    })
  }

  /** Estilo do mapa com os nomes dos lugares em português. */
  async mapaEstilo({ request, response }: HttpContext) {
    if (!(await this.maps.ensureBaseAssets().catch(() => false))) {
      return response.status(503).send({ message: 'Arquivos base do mapa ausentes' })
    }
    const forwarded = request.header('x-forwarded-proto')
    const protocol = forwarded ? forwarded.split(',')[0].trim() : request.protocol()
    const style = await this.maps.generateStylesJSON(request.host(), protocol)
    return response.json(localizeLabels(style, 'pt'))
  }

  /** Cidades, vilas e bairros do mapa cujo nome combina com a busca. */
  async mapaLugares({ request }: HttpContext) {
    const q = String(request.input('q', '')).trim().slice(0, 100)
    try {
      const places = await new PlaceSearchService(this.maps).search(q)
      return places.map(({ name, kind, latitude, longitude, near }) => ({ name, kind, latitude, longitude, near: near ?? null }))
    } catch (err) {
      logger.error(`[NovoController] busca de lugares falhou: ${(err as Error).message}`)
      return []
    }
  }

  /** Apps do servidor: instalar, abrir, iniciar e parar. */
  async apps({ inertia, request }: HttpContext) {
    return inertia.render('novo/apps', {
      apps: await this.appList(),
      result: String(request.input('resultado', '')),
    })
  }

  async appAcao({ request, response }: HttpContext) {
    const { service, action } = await request.validateUsing(appActionValidator)
    // Só apps que a tela mostra: nada de dependências internas nem atalhos.
    if (!(await this.appList()).some((a) => a.name === service)) {
      return response.redirect().toPath('/novo/apps?resultado=erro')
    }
    try {
      const result =
        action === 'install'
          ? await this.docker.createContainerPreflight(service)
          : await this.docker.affectContainer(service, action)
      if (!result.success) throw new Error(result.message)
      return response.redirect().toPath(`/novo/apps?resultado=${action}`)
    } catch (err) {
      logger.error(`[NovoController] falha em ${action} de ${service}: ${(err as Error).message}`)
      return response.redirect().toPath('/novo/apps?resultado=erro')
    }
  }

  private async appList() {
    const services = await this.systemService.getServices({ installedOnly: false })
    return services
      .filter((s) => !s.is_link_tile)
      .map((s) => ({
        name: s.service_name,
        label: s.friendly_name || s.service_name,
        description: s.description ?? null,
        isCustom: !!s.is_custom,
        installed: !!s.installed,
        installation: s.installation_status ?? 'idle',
        status: s.status ?? 'unknown',
        uiLocation: s.ui_location || null,
        customUrl: s.custom_url ?? null,
      }))
  }

  /** Pergunta à IA local, que responde com base no acervo do servidor. */
  async perguntar({ inertia, request }: HttpContext) {
    const q = String(request.input('q', '')).trim().slice(0, 500)
    return inertia.render('novo/perguntar', { q, model: await this.chatModel() })
  }

  /** Fichas que combinam com uma pergunta, para mostrar antes da resposta da IA. */
  async fichasSugeridas({ request }: HttpContext) {
    const q = String(request.input('q', '')).slice(0, 500)
    return searchFichas(FICHAS, q, 2).map(({ slug, title, summary }) => ({ slug, title, summary }))
  }

  /**
   * Modelo de conversa: o último usado no chat, se ainda estiver instalado; senão
   * o primeiro instalado. null quando não há IA ou modelo.
   */
  private async chatModel(): Promise<string | null> {
    try {
      const models = await this.ollama.getModels()
      if (models.length === 0) return null
      const last = await KVStore.getValue('chat.lastModel')
      return models.some((m) => m.name === last) ? (last as string) : models[0].name
    } catch {
      return null
    }
  }

  /** Estado do servidor para quem cuida dele. */
  async estado({ inertia }: HttpContext) {
    const [services, library, model, docs] = await Promise.all([
      this.systemService.getServices({ installedOnly: true }),
      this.librarySearch.status(),
      this.chatModel(),
      new ReferenceDocsService().status(),
    ])
    return inertia.render('novo/estado', {
      services: services
        .filter((s) => !s.is_link_tile)
        .map((s) => ({
          name: s.service_name,
          label: s.friendly_name || s.service_name,
          isCustom: !!s.is_custom,
          status: s.status ?? 'unknown',
        })),
      library,
      ai: {
        installed: services.some((s) => s.service_name === SERVICE_NAMES.OLLAMA),
        model,
      },
      references: { total: docs.length, available: docs.filter((d) => d.available).length },
    })
  }

  /** Fichas de primeiros socorros. */
  async fichas({ inertia }: HttpContext) {
    return inertia.render('novo/fichas', {
      fichas: FICHAS.map(({ slug, title, summary }) => ({ slug, title, summary })),
    })
  }

  async ficha({ inertia, params, response }: HttpContext) {
    const ficha = FICHAS.find((f) => f.slug === params.slug)
    if (!ficha) return response.redirect().toPath('/novo/fichas')
    const docs = await new ReferenceDocsService().status()
    const related = FICHAS.filter((f) => f.slug !== ficha.slug).map(({ slug, title }) => ({ slug, title }))
    return inertia.render('novo/ficha', { ficha, docs, related })
  }

  /** PDF oficial guardado no servidor; sem ele, explica e mostra o endereço da fonte. */
  async referencia({ inertia, params, response }: HttpContext) {
    const service = new ReferenceDocsService()
    const opened = await service.open(String(params.id))
    if (opened) {
      response.header('Content-Type', 'application/pdf')
      response.header('Content-Length', String(opened.doc.sizeBytes))
      response.header('Content-Disposition', `inline; filename="${opened.doc.id}.pdf"`)
      response.header('X-Content-Type-Options', 'nosniff')
      return response.stream(opened.stream)
    }
    const doc = (await service.status()).find((d) => d.id === params.id)
    if (!doc) return response.redirect().toPath('/novo/fichas')
    void service.ensureAll()
    response.status(404)
    return inertia.render('novo/referencia', { doc })
  }

  /** Parte do caminho depois do prefixo, ainda codificada como veio na URL. */
  private rest(url: string, prefix: string): string {
    return url.startsWith(prefix) ? url.slice(prefix.length) : ''
  }

  private async sharedProps() {
    return {
      services: await this.systemService.getServices({ installedOnly: true }),
      drugReferenceInstalled: await isDrugReferenceInstalled(),
    }
  }
}
