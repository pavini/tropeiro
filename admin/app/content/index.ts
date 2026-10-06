import { activeContentDir, loadContent, type LoadedContent } from './loader.js'

/**
 * Conteúdo do Tropeiro (pasta conteudo/): fichas, guias e referências em
 * Markdown, a lista de fontes oficiais e os temas. Lido quando o servidor sobe,
 * da pasta que vale (a baixada pela internet ou a que veio com o Tropeiro), e
 * relido sem reiniciar quando chega conteúdo novo (reloadContent).
 */
export const CONTENT: LoadedContent = loadContent(activeContentDir())

export const CONTENT_ITEMS = CONTENT.items
export const CONTENT_THEMES = CONTENT.themes

/**
 * Troca o conteúdo em uso pelo de outra pasta, já validado. As listas são
 * trocadas no lugar, para quem importou FICHAS, REFERENCE_DOCS etc. ver o novo.
 */
export function reloadContent(next: LoadedContent): void {
  const swap = <T>(target: T[], source: T[]) => target.splice(0, target.length, ...source)
  swap(CONTENT.items, next.items)
  swap(CONTENT.fichas, next.fichas)
  swap(CONTENT.sources, next.sources)
  swap(CONTENT.themes, next.themes)
  swap(CONTENT.problems, next.problems)
  CONTENT.dir = next.dir
  CONTENT.format = next.format
}

// Arquivo com problema fica de fora; o aviso vai para o log do servidor (ou
// para o console, fora dele, como nos testes).
if (CONTENT.problems.length) {
  const lines = CONTENT.problems.map((p) => `[Conteudo] ${p.file}${p.line ? `:${p.line}` : ''}: ${p.message} (arquivo ignorado)`)
  import('@adonisjs/core/services/logger')
    .then(({ default: logger }) => lines.forEach((l) => logger.warn(l)))
    .catch(() => lines.forEach((l) => console.warn(l)))
}
