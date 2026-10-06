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
import { RemoteOllamaService } from '#services/remote_ollama_service'
import { EMBEDDING_MODEL_NAME } from '../../constants/ollama.js'
import { InstalledContentService } from '#services/installed_content_service'
import { DockerService } from '#services/docker_service'
import { MapService } from '#services/map_service'
import { mapTitle } from '../utils/installed_content.js'
import { localizeLabels } from '../utils/map_labels.js'
import { PlaceSearchService } from '#services/place_search_service'
import KVStore from '#models/kv_store'
import { FICHAS } from '../content/fichas.js'
import { searchFichas } from '../utils/fichas_search.js'
import { CONTENT, CONTENT_ITEMS, CONTENT_THEMES } from '../content/index.js'
import { DOWNLOADED_DIR, contentUpdatesEnabled } from '../content/loader.js'
import { markPassage } from '../utils/html_snapshot.js'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

/**
 * Interface nova do Tropeiro, a principal. A clássica segue como administração avançada.
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
const aiAddressValidator = vine.compile(
  vine.object({ url: vine.string().trim().maxLength(500).nullable() })
)
const aiModelValidator = vine.compile(
  vine.object({ model: vine.string().trim().minLength(1).maxLength(255) })
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
    private maps: MapService,
    private remoteOllama: RemoteOllamaService
  ) {}

  async inicio({ inertia }: HttpContext) {
    return inertia.render('novo/inicio', await this.sharedProps())
  }

  async busca({ inertia, request }: HttpContext) {
    const q = String(request.input('q', '')).trim().slice(0, 200)
    const [shared, library] = await Promise.all([this.sharedProps(), this.librarySearch.search(q)])
    const fichas = searchFichas(FICHAS, q).map(({ slug, title, summary }) => ({ slug, title, summary }))
    // Fichas já aparecem acima; aqui entram guias e referências.
    const conteudos = searchFichas(
      CONTENT_ITEMS.filter((i) => i.type !== 'ficha'),
      q
    ).map(({ id, title, summary }) => ({ id, title, summary }))
    return inertia.render('novo/busca', { ...shared, q, library, fichas, conteudos })
  }

  /** Artigo da biblioteca lido dentro do Tropeiro: /ler/<livro>/<página>. */
  async ler({ inertia, request, response }: HttpContext) {
    const q = String(request.input('q', '')).trim().slice(0, 200) || undefined
    const result = await this.libraryReader.read(this.rest(request.url(), '/ler/'), q)
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
    const result = await this.libraryReader.asset(this.rest(request.url(), '/arquivo/'))
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
      return response.redirect().toPath(`/montar?resultado=${started > 0 ? 'iniciado' : 'nada'}`)
    } catch (err) {
      logger.error(`[NovoController] falha ao aplicar o kit ${kit}: ${(err as Error).message}`)
      return response.redirect().toPath('/montar?resultado=erro')
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
      return response.redirect().toPath('/conteudo?resultado=apagado')
    } catch (err) {
      logger.error(`[NovoController] falha ao apagar ${kind} ${id}: ${(err as Error).message}`)
      return response.redirect().toPath('/conteudo?resultado=erro')
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
      return response.redirect().toPath('/apps?resultado=erro')
    }
    // Com a IA em outro endereço, subir o contêiner local brigaria pela porta 11434.
    if (service === SERVICE_NAMES.OLLAMA && action !== 'stop' && (await this.remoteOllama.url())) {
      return response.redirect().toPath('/apps?resultado=ia-externa')
    }
    try {
      const result =
        action === 'install'
          ? await this.docker.createContainerPreflight(service)
          : await this.docker.affectContainer(service, action)
      if (!result.success) throw new Error(result.message)
      return response.redirect().toPath(`/apps?resultado=${action}`)
    } catch (err) {
      logger.error(`[NovoController] falha em ${action} de ${service}: ${(err as Error).message}`)
      return response.redirect().toPath('/apps?resultado=erro')
    }
  }

  private async appList() {
    const [services, remoteUrl] = await Promise.all([
      this.systemService.getServices({ installedOnly: false }),
      this.remoteOllama.url(),
    ])
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
        remoteAi: s.service_name === SERVICE_NAMES.OLLAMA && !!remoteUrl,
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
    return this.pickChatModel((await this.aiModels()).chat)
  }

  private async pickChatModel(models: string[]): Promise<string | null> {
    if (models.length === 0) return null
    const last = await KVStore.getValue('chat.lastModel')
    return last && models.includes(last) ? last : models[0]
  }

  /** Modelos da IA em uso: os de conversa e se há o que lê os documentos. */
  private async aiModels(): Promise<{ chat: string[]; embedding: boolean }> {
    try {
      const names = (await this.ollama.getModels(true)).map((m) => m.name)
      return {
        chat: names.filter((n) => !n.includes('embed')),
        embedding: names.some((n) => n === EMBEDDING_MODEL_NAME || n.toLowerCase().includes('nomic-embed-text')),
      }
    } catch {
      return { chat: [], embedding: false }
    }
  }

  /** Onde a IA roda, o modelo das respostas e os documentos oficiais. */
  async ia({ inertia, request }: HttpContext) {
    // Endereço externo fora do ar: nem pergunta os modelos, que demoraria a falhar.
    const remote = await this.remoteOllama.status()
    const noAnswer = { chat: [], embedding: false }
    const [services, models, references] = await Promise.all([
      this.systemService.getServices({ installedOnly: false }),
      remote.configured && !remote.connected ? noAnswer : this.aiModels(),
      new ReferenceDocsService().aiStatus().catch(() => null),
    ])
    const local = services.find((s) => s.service_name === SERVICE_NAMES.OLLAMA)
    // Com endereço externo o serviço fica marcado como instalado mesmo sem contêiner.
    const container = !!local?.status && local.status !== 'unknown'
    return inertia.render('novo/ia', {
      remote: remote.url ? { url: remote.url, reachable: remote.connected } : null,
      local: {
        installed: !!local?.installed && (remote.url ? container : true),
        running: local?.status === 'running',
      },
      models: models.chat,
      model: await this.pickChatModel(models.chat),
      embedding: models.embedding,
      embeddingModel: EMBEDDING_MODEL_NAME,
      references,
      result: String(request.input('resultado', '')),
    })
  }

  /** Testa um endereço de IA sem gravar nada: responde e quais modelos tem. */
  async iaTestar({ request }: HttpContext) {
    const url = String(request.input('url', '')).trim().slice(0, 500)
    if (!url) return { ok: false, reason: 'invalid_url', models: [] }
    const probe = await this.remoteOllama.probe(url)
    return probe.ok
      ? { ok: true, models: probe.models }
      : { ok: false, reason: probe.reason, status: probe.status ?? null, models: [] }
  }

  /** Passa a usar a IA de outro endereço; sem endereço, volta para a deste servidor. */
  async iaEndereco({ request, response }: HttpContext) {
    const { url } = await request.validateUsing(aiAddressValidator)
    const result = await this.remoteOllama.configure(url ?? null)
    if (result.success) return response.redirect().toPath(`/ia?resultado=${url ? 'endereco' : 'local'}`)
    logger.error(`[NovoController] falha ao configurar a IA em ${url ?? '(local)'}: ${result.message}`)
    return response.redirect().toPath(`/ia?resultado=${result.reason === 'not_found' ? 'erro' : 'sem-resposta'}`)
  }

  /** Modelo que responde às perguntas: o mesmo que a tela Perguntar usa. */
  async iaModelo({ request, response }: HttpContext) {
    const { model } = await request.validateUsing(aiModelValidator)
    const { chat } = await this.aiModels()
    if (!chat.includes(model)) return response.redirect().toPath('/ia?resultado=erro')
    await KVStore.setValue('chat.lastModel', model)
    return response.redirect().toPath('/ia?resultado=modelo')
  }

  /** Estado do servidor para quem cuida dele. */
  async estado({ inertia }: HttpContext) {
    const remote = await this.remoteOllama.status()
    const [services, library, model, docs] = await Promise.all([
      this.systemService.getServices({ installedOnly: true }),
      this.librarySearch.status(),
      remote.configured && !remote.connected ? null : this.chatModel(),
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
        remote: remote.url ? { url: remote.url, reachable: remote.connected } : null,
      },
      references: {
        total: docs.length,
        available: docs.filter((d) => d.available).length,
        ai: await new ReferenceDocsService().aiStatus().catch(() => null),
      },
      content: await this.contentStatus(),
    })
  }

  /** Conteúdo do Tropeiro em uso e o resultado da última busca por conteúdo novo. */
  private async contentStatus() {
    const { ContentUpdateService } = await import('#services/content_update_service')
    const state = await new ContentUpdateService().state()
    return {
      enabled: contentUpdatesEnabled(),
      source: CONTENT.dir === DOWNLOADED_DIR ? ('downloaded' as const) : ('bundled' as const),
      updatedAt: state.updatedAt,
      lastCheckAt: state.lastCheckAt,
      lastResult: state.lastResult,
      lastMessage: state.lastMessage,
    }
  }

  /** Procura conteúdo novo agora (botão no estado do servidor). */
  async atualizarConteudo({ response }: HttpContext) {
    const { ContentUpdateService } = await import('#services/content_update_service')
    const state = await new ContentUpdateService().check()
    return response.redirect().toPath(`/estado?conteudo=${state.lastResult ?? 'erro'}`)
  }

  /** Conteúdos por tema (pasta conteudo/). */
  async temas({ inertia }: HttpContext) {
    return inertia.render('novo/temas', {
      themes: CONTENT_THEMES.map((theme) => ({
        ...theme,
        count: CONTENT_ITEMS.filter((i) => i.theme === theme.id).length,
      })).filter((theme) => theme.count > 0),
    })
  }

  async tema({ inertia, params, response }: HttpContext) {
    const theme = CONTENT_THEMES.find((t) => t.id === params.tema)
    if (!theme) return response.redirect().toPath('/temas')
    return inertia.render('novo/tema', {
      theme,
      items: CONTENT_ITEMS.filter((i) => i.theme === theme.id).map(({ id, slug, type, title, summary }) => ({
        id,
        type,
        title,
        summary,
        // Fichas abrem na tela de ficha, feita para emergência.
        href: type === 'ficha' ? `/fichas/${slug}` : `/temas/${id}`,
      })),
    })
  }

  async conteudoItem({ inertia, params, response }: HttpContext) {
    const item = CONTENT_ITEMS.find((i) => i.id === `${params.tema}/${params.slug}`)
    if (!item) return response.redirect().toPath(`/temas/${params.tema}`)
    if (item.type === 'ficha') return response.redirect().toPath(`/fichas/${item.slug}`)
    const theme = CONTENT_THEMES.find((t) => t.id === item.theme)
    const seeAlso = item.seeAlso
      .map((id) => CONTENT_ITEMS.find((i) => i.id === id))
      .filter((i): i is NonNullable<typeof i> => !!i)
      .map((i) => ({ title: i.title, href: i.type === 'ficha' ? `/fichas/${i.slug}` : `/temas/${i.id}` }))
    return inertia.render('novo/conteudo-item', {
      item,
      theme: theme ? { id: theme.id, title: theme.title } : null,
      seeAlso,
      docs: await new ReferenceDocsService().status(),
    })
  }

  /** Endereços da primeira versão dos guias, de antes do formato em Markdown. */
  async guiaAntigo({ params, response }: HttpContext) {
    const old: Record<string, string> = {
      'radio-como-funciona': 'radio/como-o-radio-funciona',
      'radio-sem-licenca': 'radio/radios-sem-licenca',
    }
    const id = params.slug ? old[params.slug] : undefined
    return response.redirect().toPath(id ? `/temas/${id}` : '/temas/radio')
  }

  /** Fichas de primeiros socorros. */
  async fichas({ inertia }: HttpContext) {
    return inertia.render('novo/fichas', {
      fichas: FICHAS.map(({ slug, title, summary }) => ({ slug, title, summary })),
    })
  }

  async ficha({ inertia, params, response }: HttpContext) {
    const ficha = FICHAS.find((f) => f.slug === params.slug)
    if (!ficha) return response.redirect().toPath('/fichas')
    const docs = await new ReferenceDocsService().status()
    const related = FICHAS.filter((f) => f.slug !== ficha.slug).map(({ slug, title }) => ({ slug, title }))
    return inertia.render('novo/ficha', { ficha, docs, related })
  }

  /** PDF oficial guardado no servidor; sem ele, explica e mostra o endereço da fonte. */
  async referencia({ inertia, params, request, response }: HttpContext) {
    const service = new ReferenceDocsService()
    const opened = await service.open(String(params.id))
    if (opened) {
      const html = opened.doc.format === 'html'
      // Norma guardada como página: o trecho citado vem destacado e com âncora.
      const passage = String(request.input('trecho', '')).slice(0, 300)
      if (html && passage) {
        const chunks: Buffer[] = []
        for await (const chunk of opened.stream) chunks.push(chunk as Buffer)
        const body = markPassage(Buffer.concat(chunks).toString('utf-8'), passage)
        response.header('Content-Type', 'text/html; charset=utf-8')
        response.header('X-Content-Type-Options', 'nosniff')
        response.header('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'; sandbox")
        return response.send(body)
      }
      response.header('Content-Type', html ? 'text/html; charset=utf-8' : 'application/pdf')
      response.header('Content-Length', String(opened.size))
      response.header('Content-Disposition', `inline; filename="${opened.doc.id}.${html ? 'html' : 'pdf'}"`)
      response.header('X-Content-Type-Options', 'nosniff')
      // Cópia de página externa: nada executa, nada é buscado fora.
      if (html) response.header('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'; sandbox")
      return response.stream(opened.stream)
    }
    const doc = (await service.status()).find((d) => d.id === params.id)
    if (!doc) return response.redirect().toPath('/fichas')
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
    }
  }
}
