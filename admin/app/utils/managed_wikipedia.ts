/**
 * Idiomas cuja Wikipedia geral pode ser escolhida no seletor de Wikipedia.
 * O upstream só reconhece `wikipedia_en_`; o Tropeiro acrescenta o português.
 */
export const MANAGED_WIKIPEDIA_LANGUAGES = ['en', 'pt'] as const

const MANAGED_WIKIPEDIA_PATTERN = new RegExp(
  `^wikipedia_(?:${MANAGED_WIKIPEDIA_LANGUAGES.join('|')})_(?:all|top)_(?:mini|nopic|maxi)_`
)

/**
 * Diz se um arquivo (nome ou URL) é uma Wikipedia geral gerenciada pelo seletor
 * de Wikipedia, e não um ZIM temático que usa o mesmo prefixo.
 *
 * O teste por prefixo `wikipedia_en_` do upstream também capturava ZIMs de
 * categoria como `wikipedia_en_medicine_maxi`, que eram tratados como a
 * Wikipedia escolhida. Exigir `all|top` + variante evita isso para todos os
 * idiomas.
 */
export function isManagedWikipediaFile(nameOrUrl: string): boolean {
  const filename = nameOrUrl.split('?')[0].split('/').pop() ?? ''
  return MANAGED_WIKIPEDIA_PATTERN.test(filename)
}
