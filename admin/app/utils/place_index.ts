/**
 * Índice de lugares para a busca por nome no mapa: cidades, vilas e bairros
 * lidos do próprio arquivo do mapa. Sem dependências, para poder testar.
 */

export type PlaceKind = 'city' | 'town' | 'village' | 'neighbourhood'

export interface Place {
  name: string
  kind: PlaceKind
  latitude: number
  longitude: number
  population: number
  /** Cidade maior mais próxima, para diferenciar nomes repetidos. */
  near?: string
}

const KIND_ORDER: Record<PlaceKind, number> = { city: 0, town: 1, village: 2, neighbourhood: 3 }

/** Até onde procurar a cidade de referência, em km. */
const NEAR_RADIUS_KM = 150

/** Minúsculas, sem acento e sem pontuação: "São José" → "sao jose". */
export function normalizeName(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

/** Distância aproximada em km; boa o bastante para achar o vizinho mais próximo. */
function distanceKm(a: Place, b: Place): number {
  const x = (b.longitude - a.longitude) * Math.cos(((a.latitude + b.latitude) / 2) * (Math.PI / 180))
  const y = b.latitude - a.latitude
  return Math.sqrt(x * x + y * y) * 111.32
}

/**
 * Tira repetidos (o mesmo lugar aparece em blocos vizinhos do mapa) e liga
 * cada lugar a uma cidade de referência. Um bairro fica ligado à cidade em
 * que está; cidades, vilas e povoados, à cidade maior mais próxima.
 */
export function buildPlaceIndex(raw: Place[]): Place[] {
  const seen = new Set<string>()
  const places = raw.filter((p) => {
    const key = `${normalizeName(p.name)}|${p.kind}|${p.latitude.toFixed(2)}|${p.longitude.toFixed(2)}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  const towns = places.filter((p) => p.kind === 'city' || p.kind === 'town')
  const cities = towns.filter((p) => p.kind === 'city')
  for (const place of places) {
    let best: Place | null = null
    let bestDist = NEAR_RADIUS_KM
    // Bairro: a cidade em que está. Os outros: uma cidade maior e conhecida.
    for (const anchor of place.kind === 'neighbourhood' ? towns : cities) {
      if (anchor === place || anchor.name === place.name) continue
      if (place.kind !== 'neighbourhood' && anchor.population <= place.population) continue
      const d = distanceKm(place, anchor)
      if (d < bestDist) {
        best = anchor
        bestDist = d
      }
    }
    if (best) place.near = best.name
  }
  return places
}

/**
 * Lugares cujo nome combina com o texto, sem ligar para acento e maiúscula.
 * Ordem: nome igual, começa com o texto, alguma palavra começa com o texto,
 * contém o texto; depois cidades antes de vilas e bairros, e as maiores antes.
 */
export function searchPlaces(index: Place[], query: string, limit = 8): Place[] {
  const q = normalizeName(query)
  if (q.length < 2) return []
  const scored: { place: Place; match: number }[] = []
  for (const place of index) {
    const name = normalizeName(place.name)
    const match =
      name === q ? 0 : name.startsWith(q) ? 1 : name.includes(` ${q}`) ? 2 : name.includes(q) ? 3 : -1
    if (match >= 0) scored.push({ place, match })
  }
  scored.sort(
    (a, b) =>
      a.match - b.match ||
      KIND_ORDER[a.place.kind] - KIND_ORDER[b.place.kind] ||
      b.place.population - a.place.population
  )
  return scored.slice(0, limit).map((s) => s.place)
}
