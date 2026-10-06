import logger from '@adonisjs/core/services/logger'
import axios from 'axios'
import { createHash } from 'node:crypto'
import { createReadStream, createWriteStream } from 'node:fs'
import { mkdir, rename, rm, stat } from 'node:fs/promises'
import { join } from 'node:path'
import type { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { REFERENCE_DOCS } from '../content/referencias.js'
import type { ReferenceDoc, ReferenceDocStatus } from '../../types/fichas.js'

const DOWNLOAD_TIMEOUT_MS = 10 * 60_000

/**
 * Documentos oficiais em que as fichas se baseiam. O servidor baixa cada um da
 * fonte oficial, confere o sha256 e guarda em storage/referencias, para que a
 * pessoa possa abrir o original mesmo sem internet.
 */
export class ReferenceDocsService {
  private static running: Promise<void> | null = null

  private get dir() {
    return join(process.cwd(), 'storage', 'referencias')
  }

  private filePath(doc: ReferenceDoc) {
    return join(this.dir, `${doc.id}.pdf`)
  }

  private async isAvailable(doc: ReferenceDoc): Promise<boolean> {
    try {
      return (await stat(this.filePath(doc))).size === doc.sizeBytes
    } catch {
      return false
    }
  }

  async status(): Promise<ReferenceDocStatus[]> {
    return Promise.all(
      REFERENCE_DOCS.map(async ({ sha256, ...doc }) => ({
        ...doc,
        available: await this.isAvailable({ sha256, ...doc }),
      }))
    )
  }

  /** Baixa o que falta. Chamadas simultâneas esperam a mesma execução. */
  ensureAll(): Promise<void> {
    if (!ReferenceDocsService.running) {
      ReferenceDocsService.running = this.downloadMissing().finally(() => {
        ReferenceDocsService.running = null
      })
    }
    return ReferenceDocsService.running
  }

  /** O PDF guardado, ou null se ainda não foi baixado. */
  async open(id: string): Promise<{ stream: Readable; doc: ReferenceDoc } | null> {
    const doc = REFERENCE_DOCS.find((d) => d.id === id)
    if (!doc || !(await this.isAvailable(doc))) return null
    return { stream: createReadStream(this.filePath(doc)), doc }
  }

  private async downloadMissing(): Promise<void> {
    await mkdir(this.dir, { recursive: true })
    for (const doc of REFERENCE_DOCS) {
      if (await this.isAvailable(doc)) continue
      try {
        await this.download(doc)
        logger.info(`[ReferenceDocs] Documento baixado: ${doc.id}`)
      } catch (err) {
        // Sem internet é o caso comum; tenta de novo na próxima rodada.
        logger.warn(`[ReferenceDocs] Não foi possível baixar ${doc.id}: ${(err as Error).message}`)
      }
    }
  }

  private async download(doc: ReferenceDoc): Promise<void> {
    const target = this.filePath(doc)
    const tmp = `${target}.tmp`
    const hash = createHash('sha256')
    try {
      const res = await axios.get(doc.url, { responseType: 'stream', timeout: DOWNLOAD_TIMEOUT_MS })
      res.data.on('data', (chunk: Buffer) => hash.update(chunk))
      await pipeline(res.data, createWriteStream(tmp))
      const digest = hash.digest('hex')
      if (digest !== doc.sha256) {
        throw new Error(`sha256 diferente do esperado (${digest}); a fonte pode ter mudado o arquivo`)
      }
      await rename(tmp, target)
    } finally {
      await rm(tmp, { force: true })
    }
  }
}
