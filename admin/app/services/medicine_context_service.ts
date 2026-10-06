import logger from '@adonisjs/core/services/logger'
import { DrugReferenceService } from '#services/drug_reference_service'
import { FtnService } from '#services/ftn_service'
import { REFERENCE_DOCS } from '../content/referencias.js'
import { FTN_ID, monografiaParaIa, monografiasCitadas } from '../utils/ftn.js'
import { bulaParaIa, escolherBula, termosDaBula } from '../utils/remedios.js'
import { referenceLabel } from '../utils/reference_pages.js'
import type { RetrievedChunk } from '../../types/rag.js'

/**
 * Trechos sobre os remédios citados numa pergunta: a monografia do Formulário
 * Terapêutico Nacional (em português) e a bula da FDA (em inglês). Achados pelo
 * nome, não pela busca por semelhança, que se perde entre português e inglês.
 */
export class MedicineContextService {
  async chunksFor(question: string): Promise<RetrievedChunk[]> {
    const chunks: RetrievedChunk[] = []

    const ftn = REFERENCE_DOCS.find((d) => d.id === FTN_ID)
    const monografias = ftn ? monografiasCitadas(question, new FtnService().prontas(), 2) : []
    for (const m of monografias) {
      chunks.push({
        text: monografiaParaIa(m),
        score: 1,
        metadata: { archive_title: referenceLabel(ftn!), reference_id: FTN_ID, page: m.pagina },
      } as RetrievedChunk)
    }

    const drugs = new DrugReferenceService()
    for (const termo of termosDaBula(question, 2)) {
      try {
        const label = escolherBula(await drugs.search(termo, { limit: 25 }), termo)
        const detail = label ? await drugs.find(label.id) : null
        if (!detail) continue
        const name = detail.brand_name ?? detail.generic_name ?? termo
        chunks.push({
          text: bulaParaIa(detail),
          score: 1,
          metadata: { archive_title: `Bula da FDA (Estados Unidos, em inglês): ${name}`, drug_label_id: detail.id },
        } as RetrievedChunk)
      } catch (err) {
        // Sem a base de bulas instalada a busca falha ou não acha nada; segue sem ela.
        logger.debug(`[MedicineContext] bula de ${termo}: ${(err as Error).message}`)
      }
    }
    return chunks
  }
}
