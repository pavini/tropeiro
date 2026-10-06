import { parseMapFilename } from './map_filename.js'

/**
 * Nomes legíveis para o conteúdo instalado, a partir do nome do arquivo e do
 * que o library XML do Kiwix sabe dele.
 */

const regionNames = new Intl.DisplayNames(['pt-BR'], { type: 'region' })

/** "nhs.uk_en_medicines_2025-12.zim" → "Nhs.uk en medicines" */
function prettify(name: string): string {
  const text = name.replace(/[_-]+/g, ' ').trim()
  return text.charAt(0).toUpperCase() + text.slice(1)
}

/** Título do livro: o do Kiwix, ou o nome do arquivo sem a data. */
export function bookTitle(filename: string, kiwixTitle?: string): string {
  if (kiwixTitle?.trim()) return kiwixTitle.trim()
  return prettify(filename.replace(/\.zim$/, '').replace(/_\d{4}-\d{2}$/, ''))
}

/** Arquivos da Wikipedia gerenciada (wikipedia_<idioma>_...). */
export function isWikipediaFile(filename: string): boolean {
  return /^wikipedia_[a-z]{2,3}_/.test(filename)
}

/**
 * Nome do mapa: países recortados viram o nome do país em português
 * ("br_20261006_z15.pmtiles" → "Brasil"); o resto vira o id legível.
 */
export function mapTitle(filename: string): string {
  const id = parseMapFilename(filename)?.resource_id ?? filename.replace(/\.pmtiles$/, '')
  const codes = id.split('-')
  if (codes.every((c) => /^[a-z]{2}$/i.test(c))) {
    try {
      return codes.map((c) => regionNames.of(c.toUpperCase()) ?? c.toUpperCase()).join(', ')
    } catch {
      // código que o Intl não conhece
    }
  }
  return prettify(id)
}
