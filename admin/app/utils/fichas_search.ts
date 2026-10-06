import type { Ficha } from '../../types/fichas.js'

/** Minúsculas e sem acento, para "Queimadura" achar "queimadura" e "agua" achar "água". */
export function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
}

/** Palavras pequenas demais, comuns demais ou de pergunta ("como", "posso"): não contam como acerto. */
const STOPWORDS = new Set(['de', 'da', 'do', 'das', 'dos', 'em', 'no', 'na', 'com', 'para', 'por', 'um', 'uma', 'o', 'a', 'e', 'que', 'se', 'como', 'qual', 'quais', 'quando', 'onde', 'porque', 'faco', 'fazer', 'faz', 'preciso', 'precisa', 'posso', 'pode', 'devo', 'sobre', 'isso', 'esse', 'essa', 'tem', 'ter'])

const words = (text: string) =>
  normalizeText(text)
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w))

/** Qualquer conteúdo buscável por título e palavras-chave (fichas, guias). */
type Searchable = Pick<Ficha, 'title' | 'keywords'>

/**
 * Fichas (ou guias) que combinam com a busca, das mais para as menos
 * relevantes. Busca no título e nas palavras-chave, sem acento; aceita o
 * começo de uma palavra ("queim" acha "queimadura"). `minScore` 3 exige uma
 * palavra-chave ou o título inteiro, não só uma palavra solta do título.
 */
export function searchFichas<T extends Searchable>(fichas: T[], query: string, limit = 3, minScore = 1): T[] {
  const q = normalizeText(query)
  if (q.length < 3) return []
  const qWords = words(query)

  const scored = fichas.map((ficha) => {
    const title = normalizeText(ficha.title)
    const keywords = ficha.keywords.map(normalizeText)
    let score = 0
    if (title.includes(q)) score += 5
    if (keywords.some((k) => k === q)) score += 5
    // Cada palavra-chave contida na busca (ou que contém a busca) soma.
    score += 3 * keywords.filter((k) => k !== q && (k.includes(q) || q.includes(k))).length
    // Palavras da busca no título valem mais que nas palavras-chave: "água para
    // beber" deve achar "Água para beber: como tratar" antes de "Afogamento".
    const titleWords = words(ficha.title)
    const vocab = new Set([...titleWords, ...ficha.keywords.flatMap(words)])
    for (const w of qWords) {
      if (titleWords.some((v) => v === w || v.startsWith(w))) score += 2
      else if ([...vocab].some((v) => v === w || v.startsWith(w))) score += 1
    }
    return { ficha, score }
  })

  return scored
    .filter((s) => s.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.ficha)
}
