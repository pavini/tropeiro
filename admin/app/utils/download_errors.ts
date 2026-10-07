/**
 * Erros de download que não se resolvem tentando de novo. Um arquivo que não
 * existe mais na fonte (404) ou que a fonte recusa (403) faria o job tentar 10
 * vezes, com espera crescente, e a pessoa veria "na fila" por umas 4 horas.
 * Falta de internet, demora e servidor fora do ar (5xx) seguem sendo tentados.
 */
export function permanentDownloadError(error: unknown): string | null {
  const status = (error as { response?: { status?: unknown } } | null)?.response?.status
  if (typeof status !== 'number' || status < 400 || status >= 500) return null
  // Demora (408) e excesso de pedidos (429) passam com o tempo.
  if (status === 408 || status === 429) return null
  if (status === 404 || status === 410) return `O arquivo não existe mais na fonte (HTTP ${status}). O catálogo pode estar desatualizado.`
  if (status === 401 || status === 403) return `A fonte recusou o download (HTTP ${status}).`
  return `A fonte recusou o pedido (HTTP ${status}).`
}
