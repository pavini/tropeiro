/** Lugares marcados no mapa: link direto para um ponto, busca e ordem da lista. */

export interface MapLink {
  latitude: number
  longitude: number
  zoom: number
  /** Lugar marcado a abrir já selecionado. */
  placeId: number | null
}

/**
 * Lê ?lat=&lng=&zoom=&lugar= do endereço. Aceita também ?long= (como o mapa
 * clássico). Sem latitude e longitude válidas, devolve null e o mapa abre onde
 * estava.
 */
export function parseMapLink(search: string): MapLink | null {
  const params = new URLSearchParams(search)
  const latText = params.get('lat')
  const lngText = params.get('lng') ?? params.get('long')
  if (!latText || !lngText) return null
  const latitude = Number(latText)
  const longitude = Number(lngText)
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null
  const zoom = Number(params.get('zoom'))
  const placeId = Number(params.get('lugar'))
  return {
    latitude,
    longitude,
    zoom: Number.isFinite(zoom) && zoom > 0 && zoom <= 22 ? zoom : 15,
    placeId: Number.isInteger(placeId) && placeId > 0 ? placeId : null,
  }
}

/** Endereço que abre o mapa neste ponto (e com o lugar selecionado, se houver). */
export function mapLink(origin: string, place: { latitude: number; longitude: number; id?: number }, zoom = 16): string {
  const params = new URLSearchParams({
    lat: place.latitude.toFixed(6),
    lng: place.longitude.toFixed(6),
    zoom: String(Math.round(zoom)),
  })
  if (place.id) params.set('lugar', String(place.id))
  return `${origin}/mapa?${params}`
}

export type PlaceSort = 'name' | 'recent'

const fold = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()

/** A lista de lugares: busca no nome e nas notas, ocultos só se pedidos, na ordem escolhida. */
export function listPlaces<T extends { name: string; notes?: string | null; visible: boolean; createdAt: string }>(
  places: T[],
  opts: { query: string; sort: PlaceSort; showHidden: boolean }
): T[] {
  const q = fold(opts.query.trim())
  return places
    .filter((p) => opts.showHidden || p.visible)
    .filter((p) => !q || fold(`${p.name} ${p.notes ?? ''}`).includes(q))
    .sort((a, b) =>
      opts.sort === 'name'
        ? a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' })
        : b.createdAt.localeCompare(a.createdAt)
    )
}
