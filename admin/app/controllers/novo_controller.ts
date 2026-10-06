import { SystemService } from '#services/system_service'
import { LibrarySearchService } from '#services/library_search_service'
import { LibraryReaderService } from '#services/library_reader_service'
import { KitService } from '#services/kit_service'
import logger from '@adonisjs/core/services/logger'
import vine from '@vinejs/vine'
import { KITS } from '../../constants/kits.js'
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

@inject()
export default class NovoController {
  constructor(
    private systemService: SystemService,
    private librarySearch: LibrarySearchService,
    private libraryReader: LibraryReaderService,
    private kits: KitService
  ) {}

  async inicio({ inertia }: HttpContext) {
    return inertia.render('novo/inicio', await this.sharedProps())
  }

  async busca({ inertia, request }: HttpContext) {
    const q = String(request.input('q', '')).trim().slice(0, 200)
    const [shared, library] = await Promise.all([this.sharedProps(), this.librarySearch.search(q)])
    return inertia.render('novo/busca', { ...shared, q, library })
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
