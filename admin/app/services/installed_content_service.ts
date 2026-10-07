import { inject } from '@adonisjs/core'
import logger from '@adonisjs/core/services/logger'
import { basename } from 'node:path'
import { ZimService } from '#services/zim_service'
import { MapService } from '#services/map_service'
import { OllamaService } from '#services/ollama_service'
import { DockerService } from '#services/docker_service'
import { KiwixLibraryService } from '#services/kiwix_library_service'
import { getFileStatsIfExists } from '../utils/fs.js'
import InstalledResource from '#models/installed_resource'
import { bookTitle, isWikipediaFile, mapTitle } from '../utils/installed_content.js'
import { SERVICE_NAMES } from '../../constants/service_names.js'
import type { ContentKind, InstalledItem } from '../../types/installed_content.js'

/**
 * Conteúdo instalado no servidor, para ver e apagar na interface nova. Apaga
 * pelos mesmos serviços da interface clássica, que também limpam a biblioteca
 * do Kiwix, a base da IA e o registro de instalados.
 */
@inject()
export class InstalledContentService {
  constructor(
    private zimService: ZimService,
    private mapService: MapService,
    private ollama: OllamaService,
    private dockerService: DockerService
  ) {}

  async list(): Promise<{ books: InstalledItem[]; maps: InstalledItem[]; models: InstalledItem[] }> {
    const [books, maps, models, updates] = await Promise.all([this.books(), this.maps(), this.models(), this.updates()])
    const bySize = (a: InstalledItem, b: InstalledItem) => (b.sizeBytes ?? 0) - (a.sizeBytes ?? 0)
    const withUpdate = (item: InstalledItem) => ({ ...item, update: updates.get(item.id) ?? null })
    return {
      books: books.map(withUpdate).sort(bySize),
      maps: maps.map(withUpdate).sort(bySize),
      models: models.sort(bySize),
    }
  }

  /**
   * Versões novas já encontradas no catálogo (a verificação roda sozinha de
   * hora em hora, ou pelo botão), pelo nome do arquivo instalado.
   */
  private async updates(): Promise<Map<string, NonNullable<InstalledItem['update']>>> {
    try {
      const rows = await InstalledResource.query().whereNotNull('available_update_version').whereNot('resource_type', 'dataset')
      return new Map(
        rows.map((r) => [
          basename(r.file_path),
          {
            resourceId: r.resource_id,
            installedVersion: r.version,
            version: r.available_update_version!,
            sizeBytes: r.available_update_size_bytes,
          },
        ])
      )
    } catch (err) {
      logger.warn(`[InstalledContent] versões novas ilegíveis: ${(err as Error).message}`)
      return new Map()
    }
  }

  async remove(kind: ContentKind, id: string): Promise<void> {
    if (kind === 'book') return this.zimService.delete(id)
    if (kind === 'map') return this.mapService.delete(id)
    // Só apaga modelo que está mesmo instalado; o nome vai direto para o Ollama.
    if (!(await this.models()).some((m) => m.id === id)) throw new Error('not_found')
    const result = await this.ollama.deleteModel(id)
    if (!result.success) throw new Error(result.message)
  }

  private async books(): Promise<InstalledItem[]> {
    const [{ files }, catalog] = await Promise.all([
      this.zimService.list(),
      new KiwixLibraryService().listBooks().catch((err) => {
        logger.warn(`[InstalledContent] library XML ilegível: ${(err as Error).message}`)
        return []
      }),
    ])
    const byFile = new Map(catalog.map((b) => [basename(b.path), b]))
    return files.map((file) => {
      const book = byFile.get(file.name)
      return {
        kind: 'book' as const,
        id: file.name,
        title: bookTitle(file.name, book?.title),
        description: book?.description?.trim() || null,
        sizeBytes: file.size_bytes,
        wikipedia: isWikipediaFile(file.name),
      }
    })
  }

  private async maps(): Promise<InstalledItem[]> {
    const { files } = await this.mapService.listRegions()
    return Promise.all(
      files.map(async (file) => {
        const stats = file.type === 'file' ? await getFileStatsIfExists(file.key) : null
        return {
          kind: 'map' as const,
          id: file.name,
          title: mapTitle(file.name),
          description: null,
          sizeBytes: stats ? Number(stats.size) : null,
          wikipedia: false,
        }
      })
    )
  }

  /** Modelos de conversa; o de busca (embedding) fica de fora, a IA depende dele. */
  private async models(): Promise<InstalledItem[]> {
    if (!(await this.dockerService.getServiceURL(SERVICE_NAMES.OLLAMA))) return []
    try {
      const models = await this.ollama.getModels()
      return models.map((m) => ({
        kind: 'model' as const,
        id: m.name,
        title: m.name,
        description: null,
        sizeBytes: m.size ?? null,
        wikipedia: false,
      }))
    } catch {
      return []
    }
  }
}
