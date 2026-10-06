import type { HttpContext } from '@adonisjs/core/http'
import logger from '@adonisjs/core/services/logger'
import { ConditionService } from '#services/condition_service'
import { conditionDrugsValidator } from '#validators/conditions'
import { affirmativeRemediesEnabled } from '../utils/affirmative_remedies.js'

/**
 * API "por situação": remédios de venda livre para uma situação da lista
 * curada ou para um texto livre. A tela fica em RemediosController.
 */
export default class ConditionsController {
  private get service() {
    return new ConditionService()
  }

  /**
   * GET /api/conditions/drugs?slug=… | ?q=…
   * Returns { condition, drugs } for a curated condition or a free-text
   * situation. Requires exactly one of slug/q.
   */
  async drugsApi({ request, response }: HttpContext) {
    try {
      const params = await request.validateUsing(conditionDrugsValidator)

      if (params.slug && params.q) {
        return response.badRequest({ error: 'Provide either slug or q, not both' })
      }

      const filterOpts = {
        route: params.route,
        sort: params.sort,
      }

      // Strip affirmative remedies from the situation-search response when the
      // gate is closed (#1040); the OTC drug matches are regulated label text and
      // are returned either way.
      const remediesOn = await affirmativeRemediesEnabled()

      if (params.slug) {
        const result = await this.service.drugsForSlug(params.slug, params.limit, filterOpts)
        if (!result) {
          return response.notFound({ error: 'Condition not found' })
        }
        return remediesOn ? result : { ...result, remedies: [] }
      }

      if (params.q) {
        const result = await this.service.drugsForFreeText(params.q, params.limit, filterOpts)
        return remediesOn ? result : { ...result, remedies: [] }
      }

      return response.badRequest({ error: 'Provide a slug or q query parameter' })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      logger.warn(`[ConditionsController] drugsApi failed: ${msg}`)
      return response.badRequest({ error: msg })
    }
  }
}
