import { inject } from '@adonisjs/core'
import logger from '@adonisjs/core/services/logger'
import axios from 'axios'
import { XMLParser } from 'fast-xml-parser'
import { DockerService } from '#services/docker_service'
import type { LibraryBookResult, LibrarySearchResult } from '../../types/library_search.js'
import { decodeEntities, parseSnippet } from '../utils/kiwix_snippet.js'
import { resolveKiwixInternalUrl } from '../utils/kiwix_url.js'

interface KiwixBook {
  id: string
  title: string
  language: string
}

const HITS_PER_BOOK = 3
const MAX_BOOKS = 12
const TIMEOUT_MS = 5000

const asArray = <T>(v: T | T[] | undefined): T[] => (v === undefined ? [] : Array.isArray(v) ? v : [v])

/**
 * Busca no acervo da biblioteca (Kiwix) livro por livro, em paralelo, e devolve
 * os resultados agrupados por livro. Buscar por livro evita a recusa do Kiwix a
 * buscas que misturam livros de línguas diferentes.
 */
@inject()
export class LibrarySearchService {
  private parser = new XMLParser({
    ignoreAttributes: false,
    // A descrição traz <b> no meio do texto; fica como string crua.
    stopNodes: ['rss.channel.item.description'],
  })

  constructor(private dockerService: DockerService) {}

  async search(query: string): Promise<LibrarySearchResult> {
    const q = query.trim()
    const baseUrl = await resolveKiwixInternalUrl(this.dockerService)
    if (!baseUrl) return { status: 'not_installed', books: [] }
    if (!q) return { status: 'ok', books: [] }

    let books: KiwixBook[]
    try {
      books = await this.listBooks(baseUrl)
    } catch (err) {
      logger.warn(`[LibrarySearch] Kiwix indisponível em ${baseUrl}: ${(err as Error).message}`)
      return { status: 'unavailable', books: [] }
    }

    const results = await Promise.all(
      books.slice(0, MAX_BOOKS).map((book) => this.searchBook(baseUrl, book, q))
    )

    const found = results
      .filter((r): r is LibraryBookResult => r !== null && r.hits.length > 0)
      // Livros em português primeiro; depois os com mais resultados.
      .sort((a, b) => {
        const pt = Number(b.language === 'por') - Number(a.language === 'por')
        return pt !== 0 ? pt : b.total - a.total
      })

    return { status: 'ok', books: found }
  }

  private async listBooks(baseUrl: string): Promise<KiwixBook[]> {
    const res = await axios.get(`${baseUrl}/catalog/v2/entries`, {
      params: { count: -1 },
      timeout: TIMEOUT_MS,
      responseType: 'text',
    })
    const feed = this.parser.parse(res.data)?.feed
    return asArray<any>(feed?.entry)
      .map((e) => ({
        id: String(e.id ?? '').replace(/^urn:uuid:/, ''),
        title: String(e.title ?? ''),
        language: String(e.language ?? ''),
      }))
      .filter((b) => b.id)
  }

  private async searchBook(baseUrl: string, book: KiwixBook, q: string): Promise<LibraryBookResult | null> {
    try {
      const res = await axios.get(`${baseUrl}/search`, {
        params: { 'books.id': book.id, 'pattern': q, 'format': 'xml', 'pageLength': HITS_PER_BOOK },
        timeout: TIMEOUT_MS,
        responseType: 'text',
      })
      const channel = this.parser.parse(res.data)?.rss?.channel
      const hits = asArray<any>(channel?.item).map((item) => ({
        title: decodeEntities(String(item.title ?? '')),
        path: String(item.link ?? ''),
        snippet: parseSnippet(String(item.description ?? '')),
      }))
      return {
        bookId: book.id,
        bookTitle: book.title,
        language: book.language,
        total: Number(channel?.['opensearch:totalResults'] ?? hits.length),
        hits: hits.filter((h) => h.path.startsWith('/content/')),
      }
    } catch (err) {
      logger.warn(`[LibrarySearch] busca falhou no livro ${book.title}: ${(err as Error).message}`)
      return null
    }
  }
}
