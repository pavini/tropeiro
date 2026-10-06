/**
 * Prepara o Markdown de um conteúdo para a tela, sem dependências (testável):
 * as notas de fonte [^id] viram links numerados "#fonte-<id>", que a tela
 * transforma em link para o documento no lugar citado; o marcador de aviso
 * do GitHub (> [!ATENCAO]) sai, porque todo bloco de citação é mostrado como aviso.
 */
export function prepareContentMarkdown(body: string): { markdown: string; order: string[] } {
  const order: string[] = []
  const markdown = body
    .split('\n')
    .filter((line) => !/^>\s*\[!\w+\]\s*$/.test(line))
    .join('\n')
    .replace(/\[\^([\w-]+)\]/g, (_m, id: string) => {
      if (!order.includes(id)) order.push(id)
      return `[${order.indexOf(id) + 1}](#fonte-${id})`
    })
  return { markdown, order }
}
