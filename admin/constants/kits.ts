/**
 * Kits de conteúdo da interface nova. Cada kit junta peças do catálogo do
 * Tropeiro (collections/tropeiro/): uma opção de Wikipedia, níveis de categoria
 * e o mapa do Brasil. Aplicar um kit só acrescenta: nada já baixado é apagado
 * nem trocado por algo menor.
 *
 * Nome e descrição estão em inglês porque são chaves de tradução.
 */

export type KitId = 'essential' | 'recommended' | 'complete'

export interface KitDefinition {
  id: KitId
  name: string
  description: string
  /** id em collections/tropeiro/wikipedia.json */
  wikipedia: string
  /** slug da categoria e do nível em collections/tropeiro/kiwix-categories.json */
  tiers: { category: string; tier: string }[]
  /** Recorta o mapa do Brasil (Protomaps). */
  brazilMap: boolean
}

export const KITS: KitDefinition[] = [
  {
    id: 'essential',
    name: 'Essential',
    description:
      'First aid and health, a short Wikipedia in Portuguese, travel guides for Brazil and the map of Brazil.',
    wikipedia: 'pt-top-mini',
    tiers: [
      { category: 'medicine', tier: 'medicine-essential' },
      { category: 'brasil', tier: 'brasil-essential' },
    ],
    brazilMap: true,
  },
  {
    id: 'recommended',
    name: 'Recommended',
    description:
      'Everything in Essential, plus the full Wikipedia in Portuguese without images, school content, dictionary and books, and repair guides.',
    wikipedia: 'pt-all-nopic',
    tiers: [
      { category: 'medicine', tier: 'medicine-standard' },
      { category: 'education', tier: 'education-essential' },
      { category: 'literature', tier: 'literature-essential' },
      { category: 'diy', tier: 'diy-essential' },
      { category: 'brasil', tier: 'brasil-standard' },
    ],
    brazilMap: true,
  },
  {
    id: 'complete',
    name: 'Complete',
    description:
      'Everything in Recommended, with images in Wikipedia, more of each area, computing, and survival and farming guides (in English).',
    wikipedia: 'pt-all-maxi',
    tiers: [
      { category: 'medicine', tier: 'medicine-comprehensive' },
      { category: 'education', tier: 'education-standard' },
      { category: 'literature', tier: 'literature-standard' },
      { category: 'diy', tier: 'diy-standard' },
      { category: 'computing', tier: 'computing-standard' },
      { category: 'brasil', tier: 'brasil-standard' },
      { category: 'survival', tier: 'survival-essential' },
      { category: 'agriculture', tier: 'agriculture-standard' },
    ],
    brazilMap: true,
  },
]

/** Código do país no seletor de mapas e prefixo do arquivo recortado. */
export const BRAZIL_COUNTRY_CODE = 'BR'

/**
 * Tamanho aproximado do mapa do Brasil no zoom máximo (15), em MB. Valor da
 * estimativa do próprio pmtiles para o recorte de 2026-10-05; muda pouco entre
 * versões do mapa mundial.
 */
export const BRAZIL_MAP_ESTIMATE_MB = 4300
