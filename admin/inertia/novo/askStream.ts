import { chatStreamErrorMessage } from '~/lib/chat_stream'
import { parseSseChunk } from './sse'

export interface AskSource {
  title: string
  date?: string
  source?: string
}

export interface AskMessage {
  role: 'user' | 'assistant'
  content: string
}

/**
 * Pergunta à IA pela mesma API do chat clássico (com busca no acervo) e entrega
 * a resposta aos pedaços. Lança erro com mensagem quando o servidor recusa.
 */
export async function askStream(opts: {
  model: string
  messages: AskMessage[]
  signal: AbortSignal
  onText: (text: string) => void
  onSources: (sources: AskSource[]) => void
}): Promise<void> {
  const res = await fetch('/api/ollama/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'text/event-stream' },
    body: JSON.stringify({ model: opts.model, messages: opts.messages, stream: true }),
    signal: opts.signal,
  })
  if (!res.ok || !res.body) {
    let message = `HTTP ${res.status}`
    try {
      message = (await res.json())?.message ?? message
    } catch {
      // corpo não é JSON
    }
    throw new Error(message)
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  for (;;) {
    const { value, done } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const { events, rest } = parseSseChunk(buffer)
    buffer = rest
    for (const event of events) {
      const error = chatStreamErrorMessage(event)
      if (error) throw new Error(error)
      const e = event as { message?: { content?: string }; sources?: AskSource[] }
      if (e.message?.content) opts.onText(e.message.content)
      if (Array.isArray(e.sources)) opts.onSources(e.sources)
    }
  }
}
