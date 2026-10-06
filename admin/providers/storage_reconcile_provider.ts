import logger from '@adonisjs/core/services/logger'
import type { ApplicationService } from '@adonisjs/core/types'

/**
 * Ao iniciar o servidor, faz o registro de conteúdo instalado bater com o que
 * está no disco (ZIMs, mapas e a Wikipedia escolhida). Assim um banco perdido
 * ou recriado não faz o servidor "esquecer" o que já foi baixado.
 */
export default class StorageReconcileProvider {
  constructor(protected app: ApplicationService) {}

  async boot() {
    // Só no servidor web; comandos ace e testes não reconciliam.
    if (this.app.getEnvironment() !== 'web') return

    // Depois do boot síncrono, com banco e demais providers prontos.
    setImmediate(async () => {
      try {
        const { StorageReconcileService } = await import('#services/storage_reconcile_service')
        const result = await new StorageReconcileService().run()
        logger.info(
          `[StorageReconcileProvider] Conteúdo reconciliado com o disco: ${JSON.stringify(result)}`
        )
      } catch (err) {
        logger.error(`[StorageReconcileProvider] Falha ao reconciliar com o disco: ${(err as Error).message}`)
      }
    })
  }
}
