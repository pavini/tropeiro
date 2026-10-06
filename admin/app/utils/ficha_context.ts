import type { Ficha, ReferenceDoc } from '../../types/fichas.js'

/**
 * Ficha de primeiros socorros como trecho de contexto para a IA. A ficha é o
 * conteúdo mais confiável do servidor (texto conferido contra a fonte oficial),
 * então entra antes de qualquer outro trecho quando a pergunta combina com ela.
 */

const SECTION_LABEL: Record<Ficha['sections'][number]['kind'], string> = {
  do: 'Faça',
  dont: 'Não faça',
  help: 'Procure atendimento ou peça ajuda quando',
}

export function fichaContextTitle(ficha: Pick<Ficha, 'title'>): string {
  return `Ficha de primeiros socorros do Tropeiro: ${ficha.title}`
}

export function fichaContextText(
  ficha: Ficha,
  docs: Pick<ReferenceDoc, 'id' | 'title' | 'publisher' | 'year'>[]
): string {
  const lines: string[] = [ficha.title]
  if (ficha.callFirst) lines.push(`Antes de tudo: ${ficha.callFirst}`)
  for (const section of ficha.sections) {
    lines.push('')
    lines.push(section.title ? `${SECTION_LABEL[section.kind]} — ${section.title}:` : `${SECTION_LABEL[section.kind]}:`)
    for (const item of section.items) lines.push(`- ${item}`)
  }
  const fontes = [...new Set(ficha.refs.map((r) => r.doc))]
    .map((id) => docs.find((d) => d.id === id))
    .filter((d): d is NonNullable<typeof d> => !!d)
    .map((d) => `${d.title} (${d.publisher}, ${d.year})`)
  if (fontes.length) {
    lines.push('')
    lines.push(`Baseada em: ${fontes.join('; ')}.`)
  }
  return lines.join('\n')
}
