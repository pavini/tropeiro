/**
 * Descobre qual opção de Wikipedia do catálogo já está no disco, para
 * reconstruir a escolha quando o banco a perdeu (banco recriado, restauração).
 * Se houver mais de uma, fica a maior; em empate de tamanho, a em português.
 */
export function pickWikipediaFromDisk<T extends { id: string; url: string | null; size_mb: number }>(
  options: T[],
  filenamesOnDisk: string[]
): T | null {
  const onDisk = new Set(filenamesOnDisk)
  const present = options.filter((opt) => {
    const filename = opt.url?.split('/').pop()
    return !!filename && onDisk.has(filename)
  })
  if (present.length === 0) return null
  return present.sort((a, b) => {
    if (b.size_mb !== a.size_mb) return b.size_mb - a.size_mb
    return Number(b.id.startsWith('pt-')) - Number(a.id.startsWith('pt-'))
  })[0]
}
