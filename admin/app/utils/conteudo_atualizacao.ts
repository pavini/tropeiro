import { createHash } from 'node:crypto'

/**
 * Regras da atualização do conteúdo pela internet, sem acesso a rede nem a
 * disco (testáveis). O GitHub identifica cada arquivo pela "impressão" do git
 * (sha1 de "blob <tamanho>\0<conteúdo>"); calculando a mesma coisa aqui, dá
 * para baixar só o que mudou.
 */

export function gitBlobSha(content: Uint8Array): string {
  return createHash('sha1').update(`blob ${content.length}\0`).update(content).digest('hex')
}

/** Arquivo da pasta conteudo/ no GitHub: caminho relativo a conteudo/ e impressão. */
export interface RemoteFile {
  path: string
  sha: string
  size: number
}

/** Só os arquivos que o Tropeiro lê: Markdown e YAML, sem pastas escondidas. */
export function isContentPath(path: string): boolean {
  return /\.(md|ya?ml)$/.test(path) && !path.split('/').some((p) => p.startsWith('.'))
}

/** O que baixar (novo ou mudou) e o que fica de fora, comparando com o que já existe. */
export function planUpdate(remote: RemoteFile[], local: Map<string, string>): { download: RemoteFile[]; keep: string[]; remove: string[] } {
  const wanted = remote.filter((f) => isContentPath(f.path))
  const download = wanted.filter((f) => local.get(f.path) !== f.sha)
  const keep = wanted.filter((f) => local.get(f.path) === f.sha).map((f) => f.path)
  const remoteSet = new Set(wanted.map((f) => f.path))
  const remove = [...local.keys()].filter((p) => !remoteSet.has(p))
  return { download, keep, remove }
}

/**
 * Impressão do conjunto: muda se qualquer arquivo mudar, entrar ou sair. Serve
 * de "versão" do conteúdo e para saber se o Tropeiro foi atualizado desde o
 * último download (aí vale o conteúdo que veio com a versão nova).
 */
export function contentSetHash(files: Map<string, string>): string {
  const h = createHash('sha256')
  for (const path of [...files.keys()].sort()) h.update(`${path}\0${files.get(path)}\n`)
  return h.digest('hex')
}
