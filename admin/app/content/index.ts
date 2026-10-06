import { loadContent } from './loader.js'

/**
 * Conteúdo do Tropeiro (pasta conteudo/), lido uma vez quando o servidor sobe:
 * fichas, guias e referências em Markdown, a lista de fontes oficiais e os temas.
 */
export const CONTENT = loadContent()

export const CONTENT_ITEMS = CONTENT.items
export const CONTENT_THEMES = CONTENT.themes

// Arquivo com problema fica de fora; o aviso vai para o log do servidor (ou
// para o console, fora dele, como nos testes).
if (CONTENT.problems.length) {
  const lines = CONTENT.problems.map((p) => `[Conteudo] ${p.file}${p.line ? `:${p.line}` : ''}: ${p.message} (arquivo ignorado)`)
  import('@adonisjs/core/services/logger')
    .then(({ default: logger }) => lines.forEach((l) => logger.warn(l)))
    .catch(() => lines.forEach((l) => console.warn(l)))
}
