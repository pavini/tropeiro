import { SystemService } from '#services/system_service'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import { isDrugReferenceInstalled } from '../utils/drug_reference_installed.js'

/**
 * Interface nova do Tropeiro, servida em /novo enquanto convive com a clássica.
 * Usa os mesmos serviços e dados; só as telas são outras.
 */
@inject()
export default class NovoController {
  constructor(private systemService: SystemService) {}

  async inicio({ inertia }: HttpContext) {
    return inertia.render('novo/inicio', await this.sharedProps())
  }

  async busca({ inertia, request }: HttpContext) {
    const q = String(request.input('q', '')).trim().slice(0, 200)
    return inertia.render('novo/busca', { ...(await this.sharedProps()), q })
  }

  private async sharedProps() {
    return {
      services: await this.systemService.getServices({ installedOnly: true }),
      drugReferenceInstalled: await isDrugReferenceInstalled(),
    }
  }
}
