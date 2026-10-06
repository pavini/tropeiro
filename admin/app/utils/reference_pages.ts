import { basename } from 'node:path'
import type { ReferenceDoc } from '../../types/fichas.js'

/**
 * Documentos oficiais das fichas na base de conhecimento da IA: cada página
 * vira um trecho com o número da página, para a resposta citar "p. 133" e o
 * link abrir o PDF já nela. Sem dependências, para poder testar.
 */

/** Páginas com menos texto que isso (capa, página em branco, só imagem) ficam de fora. */
const MIN_PAGE_CHARS = 80

/** "Manual de Primeiros Socorros (Ministério da Saúde / FIOCRUZ, 2003)" */
export function referenceLabel(doc: Pick<ReferenceDoc, 'title' | 'publisher' | 'year'>): string {
  return `${doc.title} (${doc.publisher}, ${doc.year})`
}

/** Endereço que abre o PDF guardado no servidor já na página. */
export function referenceHref(id: string, page?: number): string {
  return `/referencias/${id}${page ? `#page=${page}` : ''}`
}

/** O documento oficial a que um arquivo em storage/referencias corresponde. */
export function referenceForPath<T extends { id: string }>(docs: T[], path: string): T | null {
  const name = basename(path)
  return docs.find((d) => `${d.id}.pdf` === name) ?? null
}

/**
 * Junta palavras quebradas no fim da linha ("queima-\ndura" → "queimadura") e
 * espaços repetidos, que o texto extraído do PDF traz.
 */
export function cleanPageText(text: string): string {
  return text
    .replace(/(\p{L})-\n(\p{Ll})/gu, '$1$2')
    .replace(/[ \t]+/g, ' ')
    .replace(/\s*\n\s*/g, '\n')
    .replace(/\n{2,}/g, '\n')
    .trim()
}

/** Páginas com texto suficiente para entrar na base, já limpas. */
export function pagesToEmbed(pages: { num: number; text: string }[]): { page: number; text: string }[] {
  return pages
    .map((p) => ({ page: p.num, text: cleanPageText(p.text) }))
    .filter((p) => p.text.length >= MIN_PAGE_CHARS)
}

/**
 * Lista "Fontes" das respostas: trechos do mesmo documento oficial viram uma
 * entrada só, com as páginas em ordem ("p. 133, 134"), e o link abre na
 * primeira.
 */
export function groupReferencePages(
  hits: { id: string; label: string; page: number }[]
): { id: string; label: string; pages: number[] }[] {
  const byDoc = new Map<string, { id: string; label: string; pages: number[] }>()
  for (const hit of hits) {
    const entry = byDoc.get(hit.id) ?? { id: hit.id, label: hit.label, pages: [] }
    if (!entry.pages.includes(hit.page)) entry.pages.push(hit.page)
    byDoc.set(hit.id, entry)
  }
  return [...byDoc.values()].map((e) => ({ ...e, pages: e.pages.sort((a, b) => a - b) }))
}
