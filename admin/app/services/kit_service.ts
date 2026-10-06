import { inject } from '@adonisjs/core'
import logger from '@adonisjs/core/services/logger'
import InstalledResource from '#models/installed_resource'
import { ZimService } from '#services/zim_service'
import { MapService } from '#services/map_service'
import { DownloadService } from '#services/download_service'
import { DockerService } from '#services/docker_service'
import { CollectionManifestService } from './collection_manifest_service.js'
import { KITS, BRAZIL_COUNTRY_CODE, BRAZIL_MAP_ESTIMATE_MB, type KitId } from '../../constants/kits.js'
import { SERVICE_NAMES } from '../../constants/service_names.js'
import type { KitPlan, KitStatus } from '../../types/kits.js'
import type { CategoryWithStatus } from '../../types/collections.js'
import type { WikipediaOption } from '../../types/downloads.js'

/** O mapa recortado é registrado como recurso 'map' com o código do país. */
const BRAZIL_MAP_RESOURCE_ID = BRAZIL_COUNTRY_CODE.toLowerCase()

/** Wikipedia em português do catálogo do Tropeiro (ids começam com "pt-"). */
const isPortugueseWikipedia = (id: string | undefined) => !!id && id.startsWith('pt-')

/**
 * Kits de conteúdo da interface nova: calcula o que cada kit acrescenta ao que
 * já está no servidor e dispara os downloads, usando os mesmos serviços da
 * interface clássica.
 */
@inject()
export class KitService {
  constructor(
    private zimService: ZimService,
    private mapService: MapService,
    private downloadService: DownloadService,
    private dockerService: DockerService
  ) {}

  async plans(): Promise<KitPlan[]> {
    const state = await this.state()
    return KITS.map((kit) => {
      let totalMb = 0
      let pendingMb = 0
      let downloading = false

      // Wikipedia
      const wiki = state.wikipediaOptions.find((o) => o.id === kit.wikipedia)
      if (wiki) {
        totalMb += wiki.size_mb
        const decision = this.wikipediaDecision(kit.wikipedia, state)
        if (decision === 'download') pendingMb += wiki.size_mb
        if (decision === 'downloading') downloading = true
      }

      // Categorias
      for (const ref of kit.tiers) {
        const category = state.categories.find((c) => c.slug === ref.category)
        const tier = category?.tiers.find((t) => t.slug === ref.tier)
        if (!category || !tier) continue
        const resources = CollectionManifestService.resolveTierResources(tier, category.tiers)
        totalMb += resources.reduce((sum, r) => sum + (r.size_mb ?? 0), 0)
        const missing = resources.filter((r) => !state.installedIds.has(r.id))
        if (missing.length > 0) {
          if (this.tierRank(category, category.downloadingTierSlug) >= this.tierRank(category, ref.tier)) {
            downloading = true
          } else {
            pendingMb += missing.reduce((sum, r) => sum + (r.size_mb ?? 0), 0)
          }
        }
      }

      // Mapa do Brasil
      if (kit.brazilMap) {
        totalMb += BRAZIL_MAP_ESTIMATE_MB
        if (state.brazilMapDownloading) downloading = true
        else if (!state.brazilMapInstalled) pendingMb += BRAZIL_MAP_ESTIMATE_MB
      }

      const status: KitStatus =
        pendingMb > 0 ? 'available' : downloading ? 'downloading' : 'installed'
      return {
        id: kit.id,
        name: kit.name,
        description: kit.description,
        totalMb: Math.round(totalMb),
        pendingMb: Math.round(pendingMb),
        status,
      }
    })
  }

  /** Dispara o que falta do kit. Só acrescenta; nada é apagado nem reduzido. */
  async apply(kitId: KitId): Promise<{ started: number }> {
    const kit = KITS.find((k) => k.id === kitId)
    if (!kit) throw new Error(`Kit desconhecido: ${kitId}`)
    const state = await this.state()
    let started = 0

    await this.ensureKiwixInstalled()

    if (this.wikipediaDecision(kit.wikipedia, state) === 'download') {
      await this.zimService.selectWikipedia(kit.wikipedia)
      started++
    }

    for (const ref of kit.tiers) {
      const category = state.categories.find((c) => c.slug === ref.category)
      if (!category) continue
      const current = Math.max(
        this.tierRank(category, category.installedTierSlug),
        this.tierRank(category, category.downloadingTierSlug)
      )
      if (current >= this.tierRank(category, ref.tier)) continue
      const files = await this.zimService.downloadCategoryTier(ref.category, ref.tier)
      if (files?.length) started++
    }

    if (kit.brazilMap && !state.brazilMapInstalled && !state.brazilMapDownloading) {
      await this.mapService.extractRegion({ countries: [BRAZIL_COUNTRY_CODE] as any })
      started++
    }

    logger.info(`[KitService] Kit ${kitId} aplicado: ${started} download(s) iniciados`)
    return { started }
  }

  private async state() {
    const [wikipediaState, categories, installed, jobs] = await Promise.all([
      this.zimService.getWikipediaState(),
      this.zimService.listCuratedCategories(),
      InstalledResource.query().whereIn('resource_type', ['zim', 'dataset', 'map']),
      this.downloadService.listDownloadJobs().catch(() => []),
    ])
    return {
      wikipediaOptions: wikipediaState.options as WikipediaOption[],
      wikipedia: wikipediaState.currentSelection,
      categories,
      installedIds: new Set(installed.filter((r) => r.resource_type !== 'map').map((r) => r.resource_id)),
      brazilMapInstalled: installed.some(
        (r) => r.resource_type === 'map' && r.resource_id === BRAZIL_MAP_RESOURCE_ID
      ),
      brazilMapDownloading: jobs.some(
        (j) => j.filetype === 'map' && j.title === BRAZIL_COUNTRY_CODE && j.status !== 'failed'
      ),
    }
  }

  /**
   * O que fazer com a Wikipedia do kit. Só troca por uma maior em português:
   * nunca reduz e nunca substitui uma Wikipedia em outra língua que a pessoa
   * escolheu na interface clássica.
   */
  private wikipediaDecision(
    target: string,
    state: Awaited<ReturnType<KitService['state']>>
  ): 'download' | 'downloading' | 'covered' {
    const current = state.wikipedia
    const size = (id?: string | null) =>
      state.wikipediaOptions.find((o) => o.id === id)?.size_mb ?? 0
    if (!current || current.status === 'none' || current.optionId === 'none') return 'download'
    if (current.status === 'failed') return 'download'
    if (!isPortugueseWikipedia(current.optionId)) return 'covered'
    if (size(current.optionId) >= size(target)) {
      return current.status === 'downloading' ? 'downloading' : 'covered'
    }
    return 'download'
  }

  /** Posição do nível na categoria; -1 quando não há nível. */
  private tierRank(category: CategoryWithStatus, slug: string | undefined): number {
    return slug ? category.tiers.findIndex((t) => t.slug === slug) : -1
  }

  private async ensureKiwixInstalled(): Promise<void> {
    if (await this.dockerService.getServiceURL(SERVICE_NAMES.KIWIX)) return
    const result = await this.dockerService.createContainerPreflight(SERVICE_NAMES.KIWIX)
    if (!result.success) logger.warn(`[KitService] Kiwix não foi instalado: ${result.message}`)
  }
}
