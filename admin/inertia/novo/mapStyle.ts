/** Centro do Brasil, mostrando o país inteiro. */
export const BRAZIL_VIEW = { longitude: -52.5, latitude: -14.5, zoom: 3.4 }

/** Lê "lat, lng" (aceita vírgula ou espaço entre os dois); null se não for coordenada válida. */
export function parseCoordinates(text: string): { latitude: number; longitude: number } | null {
  const parts = text.trim().split(/[\s,;]+/).filter(Boolean)
  if (parts.length !== 2) return null
  const [latitude, longitude] = parts.map(Number)
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null
  return { latitude, longitude }
}
