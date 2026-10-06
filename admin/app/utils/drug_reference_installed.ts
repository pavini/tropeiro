import { DrugReferenceService } from '#services/drug_reference_service'
import logger from '@adonisjs/core/services/logger'

/**
 * True when the offline FDA drug dataset is installed or installing. Reads the
 * two-phase ingest status: ready (fully installed) or an active phase
 * (downloading/downloaded/ingesting). rowCount > 0 covers a populated table
 * whose job history was pruned. Never throws — a status read failure hides the
 * tiles (fail-closed) rather than 500-ing the page.
 */
export async function isDrugReferenceInstalled(): Promise<boolean> {
  try {
    const status = await new DrugReferenceService().getIngestStatus()
    const installing =
      status.phase === 'downloading' ||
      status.phase === 'downloaded' ||
      status.phase === 'ingesting'
    return status.phase === 'ready' || installing || status.rowCount > 0
  } catch (err) {
    logger.error(
      `[drug-reference] install check failed: ${err instanceof Error ? err.message : String(err)}`
    )
    return false
  }
}
