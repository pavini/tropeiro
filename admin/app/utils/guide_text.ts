import type { Guide, GuideBlock } from '../../types/guias.js'
import type { ReferenceDoc } from '../../types/fichas.js'

/**
 * Guia como texto corrido (Markdown), para a base de conhecimento da IA. As
 * tabelas viram linhas "coluna: valor", que um modelo pequeno lê melhor que
 * tabela Markdown.
 */

function block(b: GuideBlock): string {
  switch (b.kind) {
    case 'text':
      return b.text
    case 'note':
      return `Atenção: ${b.text}`
    case 'list':
      return b.items.map((item, i) => (b.ordered ? `${i + 1}. ${item}` : `- ${item}`)).join('\n')
    case 'table': {
      const linhas = b.rows.map((row) => `- ${row.map((cell, i) => `${b.columns[i]}: ${cell}`).join('; ')}`)
      return [b.caption ? `${b.caption}:` : '', ...linhas, b.note ? `(${b.note})` : ''].filter(Boolean).join('\n')
    }
  }
}

export function guideTitle(guide: Pick<Guide, 'title'>): string {
  return `Guia do Tropeiro: ${guide.title}`
}

export function guideToMarkdown(guide: Guide, docs: Pick<ReferenceDoc, 'id' | 'title' | 'publisher' | 'year'>[]): string {
  const partes = [`# ${guideTitle(guide)}`, guide.summary]
  for (const section of guide.sections) {
    partes.push(`## ${section.title}`)
    for (const b of section.blocks) partes.push(block(b))
  }
  const fontes = [...new Set(guide.refs.map((r) => r.doc))]
    .map((id) => docs.find((d) => d.id === id))
    .filter((d): d is NonNullable<typeof d> => !!d)
    .map((d) => `${d.title} (${d.publisher}, ${d.year})`)
  if (fontes.length) partes.push(`Fontes: ${fontes.join('; ')}.`)
  return partes.join('\n\n') + '\n'
}
