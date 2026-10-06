import logger from '@adonisjs/core/services/logger'
import { existsSync } from 'node:fs'
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { CONTENT_ITEMS } from '../content/index.js'
import { REFERENCE_DOCS } from '../content/referencias.js'
import { contentPlainText } from '../utils/conteudo.js'
import { aiServicesInstalled } from '../utils/ai_installed.js'
import type { ContentItem } from '../../types/conteudo.js'

/**
 * Conteúdo do Tropeiro na base de conhecimento da IA. Cada guia ou referência
 * vira um arquivo de texto em storage/conteudos (<tema>__<slug>.md), que a
 * varredura da base lê; quando o texto muda (nova versão), o arquivo é
 * reescrito e lido de novo. Fichas não entram: a IA recebe a ficha inteira
 * quando a pergunta combina com ela.
 */
export class ContentKbService {
  static readonly DIR = 'storage/conteudos'
  /** Onde os guias ficavam antes do formato em Markdown; limpo na primeira sincronização. */
  private static readonly OLD_DIR = 'storage/guias'

  static fileName(item: Pick<ContentItem, 'theme' | 'slug'>): string {
    return `${item.theme}__${item.slug}.md`
  }

  private get dir() {
    return join(process.cwd(), ContentKbService.DIR)
  }

  /** Escreve os arquivos e põe na fila da IA o que for novo ou mudou. */
  async sync(): Promise<{ written: number; queued: number }> {
    await mkdir(this.dir, { recursive: true })
    const items = CONTENT_ITEMS.filter((i) => i.type !== 'ficha')
    const docTitle = (id: string) => {
      const d = REFERENCE_DOCS.find((r) => r.id === id)
      return d ? `${d.title} (${d.publisher}, ${d.year})` : undefined
    }
    const changed = new Set<string>()
    for (const item of items) {
      const path = join(this.dir, ContentKbService.fileName(item))
      const text = contentPlainText(item, docTitle)
      const current = await readFile(path, 'utf-8').catch(() => null)
      if (current !== text) {
        await writeFile(path, text)
        changed.add(path)
      }
    }

    const aiReady = await aiServicesInstalled()
    const { RagService } = await import('#services/rag_service')
    const app = (await import('@adonisjs/core/services/app')).default
    const rag = aiReady ? await app.container.make(RagService) : null

    // Conteúdo que saiu do Tropeiro sai também da base, inclusive os guias do formato antigo.
    const valid = new Set(items.map((i) => ContentKbService.fileName(i)))
    const stale = (await readdir(this.dir)).filter((f) => f.endsWith('.md') && !valid.has(f)).map((f) => join(this.dir, f))
    const oldDir = join(process.cwd(), ContentKbService.OLD_DIR)
    if (existsSync(oldDir)) stale.push(...(await readdir(oldDir)).map((f) => join(oldDir, f)))
    for (const path of stale) {
      await rm(path, { force: true })
      await rag?.purgeIndexedSource(path).catch(() => {})
    }
    if (existsSync(oldDir)) await rm(oldDir, { recursive: true, force: true })

    let queued = 0
    if (rag) {
      const { default: KbIngestState } = await import('#models/kb_ingest_state')
      for (const item of items) {
        const path = join(this.dir, ContentKbService.fileName(item))
        const state = await KbIngestState.findBy('file_path', path)
        const force = changed.has(path) && !!state
        if (state && state.state !== 'failed' && !force) continue
        const result = await rag.embedSingleFile(path, force)
        if (result.success) queued++
        else if (result.code !== 'inflight') logger.warn(`[ContentKb] ${item.id}: ${result.message}`)
      }
    }
    if (changed.size || queued) {
      logger.info(`[ContentKb] ${changed.size} conteúdo(s) atualizado(s), ${queued} na fila da IA`)
    }
    return { written: changed.size, queued }
  }
}
