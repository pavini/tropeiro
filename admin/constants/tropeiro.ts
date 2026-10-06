/**
 * Configuração própria do Tropeiro.
 *
 * Tudo que diferencia o fork do upstream em tempo de execução fica concentrado
 * aqui, para que os pontos de contato com o código do NOMAD sejam só imports.
 */

/**
 * Catálogo curado do Tropeiro (Wikipedia e categorias de ZIM), servido direto
 * da branch `tropeiro`. Mapas e Creator Packs continuam vindo do upstream.
 */
export const TROPEIRO_CATALOG_BASE_URL =
  'https://raw.githubusercontent.com/pavini/tropeiro/refs/heads/tropeiro/collections/tropeiro'

export const TROPEIRO_WIKIPEDIA_URL = `${TROPEIRO_CATALOG_BASE_URL}/wikipedia.json`
export const TROPEIRO_ZIM_CATEGORIES_URL = `${TROPEIRO_CATALOG_BASE_URL}/kiwix-categories.json`

/**
 * Idioma padrão (ISO-639-3) do explorador da biblioteca Kiwix. O usuário pode
 * trocar na tela; isto só define o que aparece na primeira abertura.
 */
export const DEFAULT_CONTENT_LANGUAGE = 'por'

/**
 * Idioma da interface (BCP 47). Os textos do front continuam em inglês no
 * código e servem de chave; a tradução sai de `inertia/i18n/locales/`.
 */
export const DEFAULT_UI_LANGUAGE = 'pt-BR'
