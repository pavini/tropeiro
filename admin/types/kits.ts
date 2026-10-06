/** Tipos dos kits de conteúdo, usados pelo servidor e pela interface nova. */

import type { KitId } from '../constants/kits.js'

/** installed: tudo baixado; downloading: o que falta já está baixando; available: falta baixar. */
export type KitStatus = 'installed' | 'downloading' | 'available'

export interface KitPlan {
  id: KitId
  /** Chave de tradução. */
  name: string
  /** Chave de tradução. */
  description: string
  /** Tamanho do kit inteiro, em MB. */
  totalMb: number
  /** Quanto ainda falta baixar, em MB (desconta o que já está no servidor ou baixando). */
  pendingMb: number
  status: KitStatus
}
