/**
 * Lê os eventos "data: {...}" de um texto SSE já recebido. Devolve os eventos
 * completos e o resto incompleto, que deve ser juntado ao próximo pedaço.
 */
export function parseSseChunk(buffer: string): { events: unknown[]; rest: string } {
  const parts = buffer.split('\n\n')
  const rest = parts.pop() ?? ''
  const events: unknown[] = []
  for (const part of parts) {
    const data = part
      .split('\n')
      .filter((line) => line.startsWith('data:'))
      .map((line) => line.slice(5).trim())
      .join('')
    if (!data) continue
    try {
      events.push(JSON.parse(data))
    } catch {
      // evento quebrado: ignora
    }
  }
  return { events, rest }
}
