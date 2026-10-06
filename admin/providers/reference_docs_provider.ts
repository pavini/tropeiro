import logger from '@adonisjs/core/services/logger'
import type { ApplicationService } from '@adonisjs/core/types'

/** De quanto em quanto tempo tenta baixar o que ainda falta (sem internet, nada acontece). */
const RETRY_MS = 60 * 60_000

/**
 * Baixa os documentos oficiais das fichas de primeiros socorros quando houver
 * internet, para ficarem disponíveis offline, e os põe na base de conhecimento
 * da IA. Tenta ao iniciar e de hora em hora enquanto faltar algum.
 */
export default class ReferenceDocsProvider {
  constructor(protected app: ApplicationService) {}

  async boot() {
    if (this.app.getEnvironment() !== 'web') return

    const run = async () => {
      try {
        const { ReferenceDocsService } = await import('#services/reference_docs_service')
        const service = new ReferenceDocsService()
        await service.ensureAll()
        // Depois de baixados, vão para a base da IA (se ela estiver instalada).
        await service.queueForAi()
        // O conteúdo do Tropeiro (guias e referências) também.
        const { ContentKbService } = await import('#services/content_kb_service')
        await new ContentKbService().sync()
      } catch (err) {
        logger.error(`[ReferenceDocsProvider] ${(err as Error).message}`)
      }
    }

    setImmediate(run)
    setInterval(run, RETRY_MS).unref()
  }
}
