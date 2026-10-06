/** Tipos das fichas de primeiros socorros e dos documentos de referência. */

/** Documento oficial em que as fichas se baseiam, baixado pelo servidor para consulta offline. */
export interface ReferenceDoc {
  id: string
  title: string
  publisher: string
  year: number
  /** Endereço oficial de onde o servidor baixa o documento. */
  url: string
  /** Para conferir que o arquivo baixado é o original. */
  sha256: string
  sizeBytes: number
  /** Trecho da própria publicação sobre reprodução, ou a falta dele. */
  license: string
}

export interface FichaRef {
  doc: string
  /** Página do PDF (não a numeração impressa), para abrir já no lugar certo. */
  page: number
  /** O que foi tirado desta parte do documento. */
  about: string
}

export interface FichaSection {
  kind: 'do' | 'dont' | 'help'
  title?: string
  items: string[]
}

export interface Ficha {
  slug: string
  title: string
  /** Uma frase com o mais urgente, mostrada na busca. */
  summary: string
  /** Termos que a pessoa pode digitar na busca. */
  keywords: string[]
  /** Quando ligar já, antes de tudo. */
  callFirst?: string
  sections: FichaSection[]
  refs: FichaRef[]
  /** Como o texto foi adaptado da fonte, quando houver adaptação. */
  adaptation?: string
  reviewed: boolean
}

/** Estado de um documento de referência no servidor. */
export interface ReferenceDocStatus extends Omit<ReferenceDoc, 'sha256'> {
  available: boolean
}
