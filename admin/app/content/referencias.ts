import { CONTENT } from './index.js'

/**
 * Documentos oficiais em que o conteúdo se baseia, de conteudo/fontes.yml. O
 * servidor baixa cada um da fonte oficial e guarda em storage/referencias, para
 * a consulta funcionar offline. Os documentos não ficam no repositório.
 */
export const REFERENCE_DOCS = CONTENT.sources
