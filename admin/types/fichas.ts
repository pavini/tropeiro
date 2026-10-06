/** Tipos das fichas de primeiros socorros e dos documentos de referência. */

/** Documento oficial em que as fichas se baseiam, baixado pelo servidor para consulta offline. */
export interface ReferenceDoc {
  id: string
  title: string
  publisher: string
  year: number
  /** Endereço oficial de onde o servidor baixa o documento. */
  url: string
  /**
   * PDF (padrão) é conferido pelo sha256 e pelo tamanho. Norma que só existe
   * como página (portal de legislação da Anatel, Planalto) é guardada como
   * cópia limpa em HTML; como a página muda de data e de layout, ela é
   * conferida pelos trechos de `mustContain`, não pelo sha256.
   */
  format?: 'pdf' | 'html'
  /** Para conferir que o arquivo baixado é o original (só PDF). */
  sha256: string
  /** Tamanho do PDF em bytes (só PDF). */
  sizeBytes: number
  /** Trechos que a página tem que conter para ser a norma certa (só HTML). */
  mustContain?: string[]
  /** Trecho da própria publicação sobre reprodução, ou a falta dele. */
  license: string
  /**
   * Para quem o documento foi escrito. Protocolos profissionais (SAMU) trazem
   * condutas com oxigênio, remédio e aparelho que não servem para leigo.
   */
  audience: 'public' | 'professional'
  /** Tema do documento (saude, radio...). Só documento de saúde liga as instruções de emergência da IA. */
  theme: string
}

export interface FichaRef {
  doc: string
  /** Página do PDF (não a numeração impressa), para abrir já no lugar certo. */
  page?: number
  /** Em norma guardada como página: trecho exato do texto, para abrir já nele. */
  anchor?: string
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
