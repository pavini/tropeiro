import logger from '@adonisjs/core/services/logger'
import { readdir } from 'node:fs/promises'
import { join } from 'node:path'
import InstalledResource from '#models/installed_resource'
import WikipediaSelection from '#models/wikipedia_selection'
import { DockerService } from '#services/docker_service'
import { ZimService } from '#services/zim_service'
import { CollectionManifestService } from './collection_manifest_service.js'
import { ZIM_STORAGE_PATH } from '../utils/fs.js'
import { pickWikipediaFromDisk } from '../utils/wikipedia_from_disk.js'

export interface ReconcileResult {
  skipped?: 'storage_empty'
  wikipedia: string | null
  zim: number
  map: number
}

/**
 * Faz o registro do que está instalado bater com o que existe no disco. Roda ao
 * iniciar o servidor: depois de perder ou recriar o banco, o conteúdo já baixado
 * volta a aparecer sem ser baixado de novo.
 */
export class StorageReconcileService {
  async run(): Promise<ReconcileResult> {
    const zimFiles = await this.zimFilesOnDisk()

    // Pasta vazia mas banco com conteúdo: o disco pode não estar montado (HD
    // externo, cartão). Não apaga o registro por causa disso.
    if (zimFiles.length === 0) {
      const registered = await InstalledResource.query().where('resource_type', 'zim').first()
      if (registered) {
        logger.warn('[StorageReconcile] Pasta de ZIMs vazia mas banco com conteúdo; nada foi alterado.')
        return { skipped: 'storage_empty', wikipedia: null, zim: 0, map: 0 }
      }
    }

    // A Wikipedia primeiro: a reconciliação de ZIMs pula o arquivo dela.
    const wikipedia = await this.reconcileWikipedia(zimFiles)
    const counts = await new CollectionManifestService().reconcileFromFilesystem()
    return { wikipedia, ...counts }
  }

  /**
   * Sem escolha de Wikipedia registrada, mas com um arquivo de Wikipedia do
   * catálogo no disco: registra esse arquivo como a escolha.
   */
  private async reconcileWikipedia(zimFiles: string[]): Promise<string | null> {
    if (await WikipediaSelection.query().first()) return null

    let options: Awaited<ReturnType<ZimService['getWikipediaOptions']>> = []
    try {
      options = await new ZimService(new DockerService()).getWikipediaOptions()
    } catch (err) {
      logger.warn(`[StorageReconcile] Catálogo de Wikipedia indisponível: ${(err as Error).message}`)
      return null
    }

    const pick = pickWikipediaFromDisk(options, zimFiles)
    if (!pick?.url) return null
    await WikipediaSelection.create({
      option_id: pick.id,
      url: pick.url,
      filename: pick.url.split('/').pop() ?? null,
      status: 'installed',
    })
    logger.info(`[StorageReconcile] Wikipedia reconstruída a partir do disco: ${pick.id}`)
    return pick.id
  }

  private async zimFilesOnDisk(): Promise<string[]> {
    try {
      return (await readdir(join(process.cwd(), ZIM_STORAGE_PATH))).filter((f) => f.endsWith('.zim'))
    } catch {
      return []
    }
  }
}
