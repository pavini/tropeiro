import logger from '@adonisjs/core/services/logger'
import { readFile, rename, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { PDFParse } from 'pdf-parse'
import { REFERENCE_DOCS } from '../content/referencias.js'
import { FTN_ID, FTN_INDICE_VERSAO, monografiasDoFtn, type Monografia } from '../utils/ftn.js'

/**
 * Monografias do Formulário Terapêutico Nacional. O índice sai do PDF já
 * baixado (storage/referencias) e fica guardado ao lado dele, para não ler as
 * 1.136 páginas de novo a cada vez que o servidor sobe.
 */
export class FtnService {
  private static cache: Monografia[] | null = null
  private static building: Promise<Monografia[]> | null = null

  private get dir() {
    return join(process.cwd(), 'storage', 'referencias')
  }

  /** As monografias; lista vazia enquanto o FTN não foi baixado. */
  monografias(): Promise<Monografia[]> {
    if (FtnService.cache) return Promise.resolve(FtnService.cache)
    if (!FtnService.building) {
      FtnService.building = this.load()
        .then((list) => {
          if (list.length) FtnService.cache = list
          return list
        })
        .finally(() => {
          FtnService.building = null
        })
    }
    return FtnService.building
  }

  /** Só o que já está pronto, sem esperar a leitura do PDF (para não atrasar uma resposta). */
  prontas(): Monografia[] {
    if (!FtnService.cache) void this.monografias()
    return FtnService.cache ?? []
  }

  private async load(): Promise<Monografia[]> {
    const doc = REFERENCE_DOCS.find((d) => d.id === FTN_ID)
    if (!doc) return []
    const indexFile = join(this.dir, `${FTN_ID}.monografias.json`)
    try {
      const saved = JSON.parse(await readFile(indexFile, 'utf-8'))
      if (saved.sha256 === doc.sha256 && saved.versao === FTN_INDICE_VERSAO && Array.isArray(saved.monografias)) {
        return saved.monografias
      }
    } catch {
      // ainda não montado
    }

    let pdf: Buffer
    try {
      pdf = await readFile(join(this.dir, `${FTN_ID}.pdf`))
    } catch {
      return []
    }
    if (pdf.length !== doc.sizeBytes) return []

    const started = Date.now()
    const parser = new PDFParse({ data: pdf })
    const result = await parser.getText()
    await parser.destroy()
    const monografias = monografiasDoFtn(result.pages)
    await writeFile(`${indexFile}.tmp`, JSON.stringify({ sha256: doc.sha256, versao: FTN_INDICE_VERSAO, monografias }))
    await rename(`${indexFile}.tmp`, indexFile)
    logger.info(`[FTN] ${monografias.length} monografias indexadas em ${Date.now() - started} ms`)
    return monografias
  }
}
