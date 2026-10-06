import { inject } from '@adonisjs/core'
import logger from '@adonisjs/core/services/logger'
import axios from 'axios'
import type { Readable } from 'node:stream'
import { DockerService } from '#services/docker_service'
import { resolveKiwixInternalUrl } from '../utils/kiwix_url.js'
import { assetUrl, prepareArticle, readUrl, toContentPath } from '../utils/kiwix_article.js'

export type ReadResult =
  | { kind: 'article'; title: string; html: string }
  | { kind: 'redirect'; to: string }
  | { kind: 'not_found' }
  | { kind: 'unavailable' }
  | { kind: 'not_installed' }

export type AssetResult =
  | { kind: 'asset'; stream: Readable; contentType: string; length?: string }
  | { kind: 'not_found' }
  | { kind: 'unavailable' }

const TIMEOUT_MS = 8000

/** Tipos de arquivo que a rota de arquivos repassa. HTML vai para a leitura. */
const ASSET_TYPES = /^(image\/(png|jpeg|gif|webp|svg\+xml|avif)|audio\/|video\/|application\/pdf)/i

/**
 * Lê artigos e arquivos do Kiwix pelo servidor, para que a interface nova os
 * mostre dentro do Tropeiro e tudo passe por uma porta só.
 */
@inject()
export class LibraryReaderService {
  constructor(private dockerService: DockerService) {}

  async read(rest: string, q?: string): Promise<ReadResult> {
    const contentPath = toContentPath(rest)
    if (!contentPath) return { kind: 'not_found' }
    const base = await resolveKiwixInternalUrl(this.dockerService)
    if (!base) return { kind: 'not_installed' }

    try {
      const res = await axios.get(`${base}${contentPath}`, {
        responseType: 'text',
        timeout: TIMEOUT_MS,
        maxRedirects: 0,
        validateStatus: (s) => s < 400 || s === 404,
      })

      if (res.status === 404) return { kind: 'not_found' }

      if (res.status >= 300) {
        const target = toContentPath(
          new URL(String(res.headers.location ?? ''), `${base}${contentPath}`).pathname.replace(
            /^\/content\//,
            ''
          )
        )
        return target ? { kind: 'redirect', to: readUrl(target, q) } : { kind: 'not_found' }
      }

      const type = String(res.headers['content-type'] ?? '')
      if (!type.includes('text/html')) return { kind: 'redirect', to: assetUrl(contentPath) }

      const article = prepareArticle(String(res.data), contentPath, q)
      return { kind: 'article', ...article }
    } catch (err) {
      logger.warn(`[LibraryReader] falha ao ler ${contentPath}: ${(err as Error).message}`)
      return { kind: 'unavailable' }
    }
  }

  async asset(rest: string): Promise<AssetResult> {
    const contentPath = toContentPath(rest)
    if (!contentPath) return { kind: 'not_found' }
    const base = await resolveKiwixInternalUrl(this.dockerService)
    if (!base) return { kind: 'not_found' }

    try {
      const res = await axios.get(`${base}${contentPath}`, {
        responseType: 'stream',
        timeout: TIMEOUT_MS,
        validateStatus: (s) => s < 400 || s === 404,
      })
      const type = String(res.headers['content-type'] ?? '')
      if (res.status === 404 || !ASSET_TYPES.test(type)) {
        res.data.destroy()
        return { kind: 'not_found' }
      }
      const length = res.headers['content-length']
      return {
        kind: 'asset',
        stream: res.data,
        contentType: type,
        length: length ? String(length) : undefined,
      }
    } catch (err) {
      logger.warn(`[LibraryReader] falha ao buscar arquivo ${contentPath}: ${(err as Error).message}`)
      return { kind: 'unavailable' }
    }
  }
}
