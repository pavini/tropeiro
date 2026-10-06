import logger from '@adonisjs/core/services/logger'
import type { ApplicationService } from '@adonisjs/core/types'

/** Primeira busca depois que o servidor sobe (dá tempo de o resto iniciar). */
const FIRST_CHECK_MS = 60_000
/** De quanto em quanto tempo procura conteúdo novo (sem internet, nada acontece). */
const INTERVAL_MS = 6 * 60 * 60_000

/**
 * Procura conteúdo novo do Tropeiro (fichas, guias, fontes) no GitHub quando
 * há internet, para correções chegarem sem esperar uma versão nova. Em
 * desenvolvimento não faz nada: vale a pasta conteudo/ do repositório.
 */
export default class ContentUpdateProvider {
  constructor(protected app: ApplicationService) {}

  async boot() {
    if (this.app.getEnvironment() !== 'web') return

    const run = async () => {
      try {
        const { ContentUpdateService } = await import('#services/content_update_service')
        const state = await new ContentUpdateService().check()
        if (state.lastResult === 'atualizado') logger.info(`[Conteudo] Conteúdo atualizado: ${state.lastMessage}`)
        else if (state.lastResult === 'invalido' || state.lastResult === 'erro') {
          logger.warn(`[Conteudo] Conteúdo novo não aplicado (${state.lastResult}): ${state.lastMessage}`)
        }
      } catch (err) {
        logger.error(`[ContentUpdateProvider] ${(err as Error).message}`)
      }
    }

    setTimeout(run, FIRST_CHECK_MS).unref()
    setInterval(run, INTERVAL_MS).unref()
  }
}
