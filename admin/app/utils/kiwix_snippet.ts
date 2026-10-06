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
