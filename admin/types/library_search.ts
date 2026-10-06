/** Tipos da busca na biblioteca (Kiwix), usados pelo servidor e pela interface nova. */

/** Trecho de texto do resultado; `bold` marca o termo encontrado. */
export interface SnippetPart {
  text: string
  bold: boolean
}

export interface LibraryHit {
  title: string
  /** Caminho no Kiwix, relativo à raiz dele (ex.: /content/livro/Artigo). */
  path: string
  snippet: SnippetPart[]
}

export interface LibraryBookResult {
  bookId: string
  bookTitle: string
  language: string
  total: number
  hits: LibraryHit[]
}

export interface LibrarySearchResult {
  /** 'ok' mesmo sem resultados; 'unavailable' quando o Kiwix não respondeu. */
  status: 'ok' | 'unavailable' | 'not_installed'
  books: LibraryBookResult[]
}
