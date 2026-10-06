import logger from '@adonisjs/core/services/logger'
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { GUIDES } from '../content/guias/index.js'
import { REFERENCE_DOCS } from '../content/referencias.js'
import { guideToMarkdown } from '../utils/guide_text.js'
import { aiServicesInstalled } from '../utils/ai_installed.js'

/**
 * Guias na base de conhecimento da IA. Cada guia vira um arquivo de texto em
 * storage/guias, que a varredura da base lê; quando o texto de um guia muda
 * (nova versão do Tropeiro), o arquivo é reescrito e lido de novo.
 */
export class GuidesKbService {
  static readonly DIR = 'storage/guias'

  private get dir() {
    return join(process.cwd(), GuidesKbService.DIR)
  }

  /** Escreve os arquivos e põe na fila da IA o que for novo ou mudou. */
  async sync(): Promise<{ written: number; queued: number }> {
    await mkdir(this.dir, { recursive: true })
    const changed = new Set<string>()
    for (const guide of GUIDES) {
      const path = join(this.dir, `${guide.slug}.md`)
      const text = guideToMarkdown(guide, REFERENCE_DOCS)
      const current = await readFile(path, 'utf-8').catch(() => null)
      if (current !== text) {
        await writeFile(path, text)
        changed.add(path)
      }
    }

    // Guia que saiu do Tropeiro sai também da base.
    const valid = new Set(GUIDES.map((g) => `${g.slug}.md`))
    const stale = (await readdir(this.dir)).filter((f) => f.endsWith('.md') && !valid.has(f))
    const aiReady = await aiServicesInstalled()
    const { RagService } = await import('#services/rag_service')
    const app = (await import('@adonisjs/core/services/app')).default
    const rag = aiReady ? await app.container.make(RagService) : null
    for (const file of stale) {
      const path = join(this.dir, file)
      await rm(path, { force: true })
      await rag?.purgeIndexedSource(path).catch(() => {})
    }

    let queued = 0
    if (rag) {
      const { default: KbIngestState } = await import('#models/kb_ingest_state')
      for (const guide of GUIDES) {
        const path = join(this.dir, `${guide.slug}.md`)
        const state = await KbIngestState.findBy('file_path', path)
        const force = changed.has(path) && !!state
        if (state && state.state !== 'failed' && !force) continue
        const result = await rag.embedSingleFile(path, force)
        if (result.success) queued++
        else if (result.code !== 'inflight') logger.warn(`[GuidesKb] ${guide.slug}: ${result.message}`)
      }
    }
    if (changed.size || queued) {
      logger.info(`[GuidesKb] ${changed.size} guia(s) atualizado(s), ${queued} na fila da IA`)
    }
    return { written: changed.size, queued }
  }
}
