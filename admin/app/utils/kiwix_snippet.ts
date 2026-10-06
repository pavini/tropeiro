import type { SnippetPart } from '../../types/library_search.js'

const ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&apos;': "'",
}

export function decodeEntities(text: string): string {
  return text
    .replace(/&(amp|lt|gt|quot|apos|#39);/g, (m) => ENTITIES[m] ?? m)
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
}

/**
 * Converte a descrição do Kiwix (HTML com o termo em <b>) em partes de texto,
 * para a tela renderizar sem injetar HTML.
 */
export function parseSnippet(raw: string): SnippetPart[] {
  const parts: SnippetPart[] = []
  const pieces = String(raw ?? '').split(/(<b>[\s\S]*?<\/b>)/i)
  for (const piece of pieces) {
    if (!piece) continue
    const bold = /^<b>/i.test(piece)
    const text = decodeEntities(piece.replace(/<[^>]*>/g, '')).replace(/\s+/g, ' ')
    if (text) parts.push({ text, bold })
  }
  // O Kiwix marca cortes com "..."; mantém só um nas pontas.
  if (parts.length > 0) {
    parts[0].text = parts[0].text.replace(/^\.{3,}/, '…')
    const last = parts[parts.length - 1]
    last.text = last.text.replace(/\.{3,}$/, '…')
  }
  return parts
}

const WORD_SPLIT = /[\s,.;:!?()[\]"'«»—–-]+/

/** Minúsculas e sem acento, para comparar termos. */
function fold(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
}

/**
 * Trecho que parece lista de navegação (caixas de rodapé da Wikipedia) e não
 * texto corrido: quase sem pontuação e com a maioria das palavras começando em
 * maiúscula, como "Choque circulatório Choque anafilático Cianeto Cocaína…".
 */
export function looksLikeNavigation(parts: SnippetPart[]): boolean {
  const text = parts.map((p) => p.text).join('')
  const words = text.split(/\s+/).filter((w) => /\p{L}/u.test(w))
  if (words.length < 12) return false
  const punctuation = (text.match(/[.,;:!?]/g) ?? []).length
  const capitalized = words.filter((w) => /^\p{Lu}/u.test(w)).length
  return punctuation / words.length < 0.05 && capitalized / words.length > 0.45
}

/**
 * Monta um trecho a partir de texto corrido (ex.: o primeiro parágrafo do
 * artigo), cortado num limite de palavras e com os termos da busca em destaque.
 */
export function highlightSnippet(text: string, query: string, maxLength = 260): SnippetPart[] {
  const clean = text.replace(/\s+/g, ' ').trim()
  let cut = clean
  if (clean.length > maxLength) {
    const space = clean.lastIndexOf(' ', maxLength)
    cut = `${clean.slice(0, space > 0 ? space : maxLength)}…`
  }
  const terms = fold(query)
    .split(WORD_SPLIT)
    .filter((t) => t.length >= 3)
  if (terms.length === 0) return [{ text: cut, bold: false }]

  const parts: SnippetPart[] = []
  for (const token of cut.split(/(\s+)/)) {
    const word = fold(token).replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '')
    const bold = word.length > 0 && terms.some((t) => word.startsWith(t))
    const last = parts[parts.length - 1]
    if (last && last.bold === bold) last.text += token
    else parts.push({ text: token, bold })
  }
  return parts
}
