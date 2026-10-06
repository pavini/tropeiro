import type { FichaRef } from './fichas.js'

/**
 * Conteúdo do Tropeiro escrito em Markdown, em conteudo/<tema>/<slug>.md.
 * O cabeçalho (frontmatter) usa nomes em português, para quem contribui; aqui
 * os campos ficam em inglês, como no resto do código.
 */

/** guia: explica um assunto; ficha: passo a passo de emergência; referencia: tabela de consulta. */
export type ContentType = 'guia' | 'ficha' | 'referencia'

export interface ContentItem {
  /** `<tema>/<slug>`, igual ao caminho do arquivo sem `.md`. */
  id: string
  theme: string
  slug: string
  type: ContentType
  title: string
  summary: string
  keywords: string[]
  /** Ids de outros conteúdos para ler junto. */
  seeAlso: string[]
  /** Fichas: o que fazer antes de tudo (ex.: ligar 192). */
  callFirst?: string
  /** Como o texto foi adaptado da fonte, quando houver adaptação. */
  adaptation?: string
  reviewed: boolean
  reviewedBy?: string
  authors: string[]
  /** Data da última atualização, AAAA-MM-DD. */
  updated: string
  /** Texto em Markdown, sem o cabeçalho e sem as definições das notas de fonte. */
  body: string
  /** Fontes: das notas de rodapé e da lista `fontes` do cabeçalho. */
  refs: (FichaRef & { note?: string })[]
  /** Caminho do arquivo, relativo à pasta conteudo/. */
  file: string
}

export interface ContentTheme {
  id: string
  title: string
  description: string
}

/** Problema achado ao ler ou validar um arquivo de conteúdo. */
export interface ContentProblem {
  file: string
  line?: number
  message: string
}
