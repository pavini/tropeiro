import type { Ficha } from '../../types/fichas.js'

/** Minúsculas e sem acento, para "Queimadura" achar "queimadura" e "agua" achar "água". */
export function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
}

/** Palavras pequenas demais ou comuns demais para contar como acerto. */
const STOPWORDS = new Set(['de', 'da', 'do', 'das', 'dos', 'em', 'no', 'na', 'com', 'para', 'por', 'um', 'uma', 'o', 'a', 'e', 'que', 'se'])

const words = (text: string) =>
  normalizeText(text)
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w))

/**
 * Fichas que combinam com a busca, das mais para as menos relevantes. Busca no
 * título e nas palavras-chave, sem acento; aceita o começo de uma palavra
 * ("queim" acha "queimadura").
 */
export function searchFichas(fichas: Ficha[], query: string, limit = 3): Ficha[] {
  const q = normalizeText(query)
  if (q.length < 3) return []
  const qWords = words(query)

  const scored = fichas.map((ficha) => {
    const title = normalizeText(ficha.title)
    const keywords = ficha.keywords.map(normalizeText)
    let score = 0
    if (title.includes(q)) score += 5
    if (keywords.some((k) => k === q)) score += 5
    else if (keywords.some((k) => k.includes(q) || q.includes(k))) score += 3
    const vocab = new Set([...words(ficha.title), ...ficha.keywords.flatMap(words)])
    for (const w of qWords) {
      if ([...vocab].some((v) => v === w || v.startsWith(w))) score += 1
    }
    return { ficha, score }
  })

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.ficha)
}
