import type { HttpContext } from '@adonisjs/core/http'
import logger from '@adonisjs/core/services/logger'
import { DrugReferenceService } from '#services/drug_reference_service'
import { searchDrugValidator, interactionsValidator } from '#validators/drug_reference'
import { parseCompareIds } from '../../util/compare_ids.js'

/**
 * API das bulas da FDA (busca, situação da base, download e remoção). As
 * telas ficam em RemediosController, na interface nova. Nunca deixa uma
 * exceção chegar à resposta.
 */
export default class DrugReferenceController {
  private get service() {
    return new DrugReferenceService()
  }

  /**
   * GET /api/drug-reference/search
   * Returns a slim collapsed result list (brand+generic pairs).
   */
  async search({ request, response }: HttpContext) {
    try {
      const params = await request.validateUsing(searchDrugValidator)
      const results = await this.service.search(params.q, {
        productType: params.product_type,
        route: params.route,
        sort: params.sort,
        limit: params.limit,
        offset: params.offset,
        scope: params.scope,
      })
      return { results }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      logger.warn(`[DrugReferenceController] search failed: ${msg}`)
      return response.badRequest({ error: msg })
    }
  }

  /**
   * GET /api/drug-reference/status
   * Returns the live ingest status DTO.
   */
  async status({ response }: HttpContext) {
    try {
      const status = await this.service.getIngestStatus()
      return status
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      logger.error(`[DrugReferenceController] status failed: ${msg}`)
      return response.internalServerError({ error: 'Could not read ingest status' })
    }
  }

  /**
   * GET /api/drug-reference/interactions?ids=1,2,3
   * Validates → parses → fetches and returns { entries: DrugInteractionEntry[] }.
   * Never leaks exceptions; integer-guards ids via parseCompareIds.
   */
  async interactionsApi({ request, response }: HttpContext) {
    try {
      const params = await request.validateUsing(interactionsValidator)
      const ids = parseCompareIds(params.ids ?? '')
      const entries = await this.service.getInteractionsFor(ids)
      return { entries }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      logger.warn(`[DrugReferenceController] interactionsApi failed: ${msg}`)
      return response.badRequest({ error: msg })
    }
  }

  /**
   * POST /api/drug-reference/download
   * Triggers the download phase (idempotent — deduped on deterministic jobId).
   * The download auto-chains the ingest phase on completion.
   */
  async download({ response }: HttpContext) {
    try {
      const result = await this.service.triggerDownload()
      return { success: true, created: result.created, message: result.message }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      logger.error(`[DrugReferenceController] download trigger failed: ${msg}`)
      return response.internalServerError({ error: 'Could not trigger download' })
    }
  }

  /**
   * POST /api/drug-reference/ingest
   * Manually (re-)runs the ingest phase from the already-downloaded on-disk
   * parts, with no re-download. Returns 404 when nothing is on disk so the UI
   * can keep its guard honest even if the button is reached out of band.
   */
  async ingest({ response }: HttpContext) {
    try {
      const result = await this.service.triggerIngestFromDisk()
      if (result.nothingDownloaded) {
        return response.notFound({ error: result.message })
      }
      return { success: true, created: result.created, message: result.message }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      logger.error(`[DrugReferenceController] ingest trigger failed: ${msg}`)
      return response.internalServerError({ error: 'Could not trigger ingest' })
    }
  }

  /**
   * POST /api/drug-reference/reset-ingest
   * Force-clears a wedged ingest job (e.g. one left 'active' by a worker killed
   * mid-ingest during an upgrade) and restarts it from the on-disk parts. The
   * escape hatch for a stuck "Indexing…" state.
   */
  async resetIngest({ response }: HttpContext) {
    try {
      const result = await this.service.resetAndReingest()
      if (result.nothingDownloaded) {
        return response.notFound({ error: result.message })
      }
      return { success: true, created: result.created, message: result.message }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      logger.error(`[DrugReferenceController] reset-ingest failed: ${msg}`)
      return response.internalServerError({ error: 'Could not reset ingest' })
    }
  }

  /**
   * POST /api/drug-reference/uninstall
   * Uninstall the offline FDA drug dataset: stop in-flight jobs, delete on-disk
   * parts, TRUNCATE drug_labels, clear KV markers, and remove the install-state
   * row (which auto-hides the home tiles). The curated-tier "remove" action.
   * Reports partial failures rather than masking them.
   */
  async uninstall({ response }: HttpContext) {
    try {
      const result = await this.service.uninstall()
      if (!result.success) {
        return response.internalServerError({
          success: false,
          rowsDropped: result.rowsDropped,
          error: result.message,
        })
      }
      return { success: true, rowsDropped: result.rowsDropped, message: result.message }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      logger.error(`[DrugReferenceController] uninstall failed: ${msg}`)
      return response.internalServerError({ error: 'Could not uninstall drug reference' })
    }
  }

  /**
   * GET /api/drug-reference/ingest-log
   * Tail the persisted app log for ingest/download lines. In production the logger
   * writes JSON to /app/storage/logs/admin.log (both the admin and worker
   * containers share that volume), so the worker's [IngestDrugDataJob] trace lands
   * there even when its stdout never reaches the log viewer. This surfaces it over
   * HTTP so the exact stall stage (zip-open vs first-record vs batch) is visible
   * without container access. Reads only the last slice of the file.
   */
  async ingestLog({ request, response }: HttpContext) {
    const LOG_PATH = '/app/storage/logs/admin.log'
    const TAIL_BYTES = 128 * 1024
    const limit = Math.min(Number(request.input('lines', 400)) || 400, 2000)
    try {
      const { stat, open } = await import('node:fs/promises')
      const st = await stat(LOG_PATH)
      const start = Math.max(0, st.size - TAIL_BYTES)
      const fh = await open(LOG_PATH, 'r')
      try {
        const buf = Buffer.alloc(st.size - start)
        await fh.read(buf, 0, buf.length, start)
        const all = buf.toString('utf8').split('\n')
        // Keep only ingest/download/worker-relevant lines; for JSON pino lines the
        // substring match still works against the embedded "msg" field.
        const re =
          /IngestDrugDataJob|DownloadDrugDataJob|DrugReference|drug-ingest|drug-download|unhandledRejection|uncaughtException|queue:work|stalled/i
        const matched = all.filter((l) => re.test(l)).slice(-limit)
        return { ok: true, path: LOG_PATH, size: st.size, count: matched.length, lines: matched }
      } finally {
        await fh.close()
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      return response.notFound({ ok: false, path: LOG_PATH, error: msg })
    }
  }
}
