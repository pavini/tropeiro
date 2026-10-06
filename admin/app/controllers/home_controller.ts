import { SystemService } from '#services/system_service'
import { isDrugReferenceInstalled } from '../utils/drug_reference_installed.js'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

@inject()
export default class HomeController {
    constructor(
        private systemService: SystemService,
    ) { }

    async index({ response }: HttpContext) {
        // Redirect / to /home
        return response.redirect().toPath('/home');
    }

    async home({ inertia }: HttpContext) {
        const services = await this.systemService.getServices({ installedOnly: true });
        return inertia.render('home', {
            system: {
                services
            },
            // Gate the Drug Reference / "When to use what" tiles behind the FDA
            // dataset install state. Installed when the curated-tier ingest has
            // reached 'ready' OR an install is in flight (downloading/ingesting) —
            // so the tile appears the moment the user opts in and persists through
            // the long install, rather than popping in only at the very end.
            drugReferenceInstalled: await isDrugReferenceInstalled(),
        })
    }
}
