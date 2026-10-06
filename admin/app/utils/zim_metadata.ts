import type { Archive } from '@openzim/libzim'

/**
 * Lê um metadado de um ZIM sem derrubar o processo. Na @openzim/libzim 4.0.0,
 * pedir uma chave que o arquivo não tem lança zim::EntryNotFound dentro do
 * código nativo, que encerra o Node inteiro (libc++abi terminate) em vez de
 * virar um erro capturável. Por isso só pede chaves listadas em metadataKeys.
 */
export function readZimMetadata(archive: Archive, key: string): string | undefined {
  try {
    if (!archive.metadataKeys.includes(key)) return undefined
    return archive.getMetadata(key) || undefined
  } catch {
    return undefined
  }
}
