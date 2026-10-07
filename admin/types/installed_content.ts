export type ContentKind = 'book' | 'map' | 'model'

/** Item instalado no servidor, como a tela de conteúdo mostra. */
export interface InstalledItem {
  kind: ContentKind
  /** Nome do arquivo (livros e mapas) ou do modelo: é o que se passa para apagar. */
  id: string
  title: string
  description: string | null
  sizeBytes: number | null
  wikipedia: boolean
  /** Versão nova encontrada no catálogo (livros e mapas), para atualizar. */
  update?: { resourceId: string; installedVersion: string; version: string; sizeBytes: number | null } | null
}
