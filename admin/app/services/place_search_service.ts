import logger from '@adonisjs/core/services/logger'
import { open, type FileHandle } from 'node:fs/promises'
import { gunzipSync } from 'node:zlib'
import { PMTiles, type Source, type RangeResponse } from 'pmtiles'
import { VectorTile } from '@mapbox/vector-tile'
import Pbf from 'pbf'
import { MapService } from '#services/map_service'
import { getFileStatsIfExists } from '../utils/fs.js'
import { buildPlaceIndex, searchPlaces, type Place, type PlaceKind } from '../utils/place_index.js'

/** Nível de zoom lido: nele o mapa já traz cidades, vilas e bairros. */
const INDEX_ZOOM = 10

/** Lê pedaços do arquivo .pmtiles direto do disco. */
class FileSource implements Source {
  constructor(
    private path: string,
    private handle: FileHandle
  ) {}

  getKey() {
    return this.path
  }

  async getBytes(offset: number, length: number): Promise<RangeResponse> {
    const buffer = Buffer.alloc(length)
    await this.handle.read(buffer, 0, length, offset)
    return { data: buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + length) }
  }
}

function placeKind(props: Record<string, unknown>): PlaceKind | null {
  if (props.kind === 'neighbourhood' || props.kind === 'macrohood') return 'neighbourhood'
  if (props.kind !== 'locality') return null
  if (props.kind_detail === 'city') return 'city'
  if (props.kind_detail === 'town') return 'town'
  return 'village'
}

const tileX = (lon: number, z: number) => Math.floor(((lon + 180) / 360) * 2 ** z)
const tileY = (lat: number, z: number) => {
  const rad = (lat * Math.PI) / 180
  return Math.floor(((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * 2 ** z)
}

/** Cidades, vilas e bairros de um arquivo de mapa. */
async function readPlaces(path: string): Promise<Place[]> {
  const handle = await open(path, 'r')
  try {
    const pmtiles = new PMTiles(new FileSource(path, handle))
    const header = await pmtiles.getHeader()
    const z = Math.min(INDEX_ZOOM, header.maxZoom)
    const places: Place[] = []
    for (let x = tileX(header.minLon, z); x <= tileX(header.maxLon, z); x++) {
      for (let y = tileY(header.maxLat, z); y <= tileY(header.minLat, z); y++) {
        const tile = await pmtiles.getZxy(z, x, y)
        if (!tile) continue
        let data = Buffer.from(tile.data)
        if (data[0] === 0x1f && data[1] === 0x8b) data = gunzipSync(data)
        const layer = new VectorTile(new Pbf(data)).layers.places
        if (!layer) continue
        for (let i = 0; i < layer.length; i++) {
          const feature = layer.feature(i)
          const props = feature.properties as Record<string, unknown>
          const kind = placeKind(props)
          const name = String(props['name:pt'] || props.name || '').trim()
          if (!kind || !name) continue
          const geometry = feature.toGeoJSON(x, y, z).geometry
          if (geometry.type !== 'Point') continue
          const [longitude, latitude] = geometry.coordinates
          places.push({ name, kind, latitude, longitude, population: Number(props.population) || 0 })
        }
      }
    }
    return places
  } finally {
    await handle.close()
  }
}

/**
 * Busca de lugares por nome no mapa, sem internet. Monta o índice na primeira
 * busca (cerca de 1 s para o mapa do Brasil) e o refaz quando os mapas mudam.
 */
export class PlaceSearchService {
  private static cache: { key: string; index: Promise<Place[]> } | null = null

  constructor(private maps = new MapService()) {}

  async search(query: string, limit = 8): Promise<Place[]> {
    return searchPlaces(await this.index(), query, limit)
  }

  private async index(): Promise<Place[]> {
    const { files } = await this.maps.listRegions()
    const regions = await Promise.all(
      files
        .filter((f) => f.type === 'file')
        .map(async (f) => ({ path: f.key, stats: await getFileStatsIfExists(f.key) }))
    )
    const key = regions.map((r) => `${r.path}:${r.stats?.size}:${r.stats?.modifiedTime.getTime()}`).sort().join('|')
    const cached = PlaceSearchService.cache
    if (cached?.key === key) return cached.index

    const index = (async () => {
      const started = Date.now()
      const raw: Place[] = []
      for (const region of regions) {
        try {
          raw.push(...(await readPlaces(region.path)))
        } catch (err) {
          logger.warn(`[PlaceSearch] não deu para ler ${region.path}: ${(err as Error).message}`)
        }
      }
      const places = buildPlaceIndex(raw)
      logger.info(`[PlaceSearch] ${places.length} lugares indexados em ${Date.now() - started} ms`)
      return places
    })()
    PlaceSearchService.cache = { key, index }
    // Se falhar, a próxima busca tenta de novo.
    index.catch(() => {
      if (PlaceSearchService.cache?.index === index) PlaceSearchService.cache = null
    })
    return index
  }
}
