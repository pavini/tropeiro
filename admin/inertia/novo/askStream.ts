import { chatStreamErrorMessage } from '~/lib/chat_stream'
import { parseSseChunk } from './sse'

export interface AskSource {
  title: string
  date?: string
  source?: string
  /** Documento oficial das fichas: abre o PDF guardado já na página citada. */
  href?: string
}

export interface AskMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface AskOptions {
  model: string
  messages: AskMessage[]
  signal: AbortSignal
  /** Conversa guardada: o servidor salva a pergunta, a resposta e cria o título. */
  sessionId?: number
  /** Pensar antes de responder (só em modelo que sabe). */
  think?: boolean
  /** false: não procura na base de conhecimento, só o que a IA sabe. */
  useKnowledgeBase?: boolean
  /** Procurar só nesta coleção da base. */
  collection?: string | null
  /** Imagens anexadas à pergunta (modelo que enxerga). */
  images?: File[]
  onText: (text: string) => void
  onThinking?: (text: string) => void
  onSources: (sources: AskSource[]) => void
  /** Motivo do fim: 'length' quando a resposta foi cortada no limite de tamanho. */
  onDone?: (reason: string | undefined) => void
}

/**
 * Pergunta à IA pela mesma API do chat clássico (com busca no acervo) e entrega
 * a resposta aos pedaços. Lança erro com mensagem quando o servidor recusa.
 */
export async function askStream(opts: AskOptions): Promise<void> {
  const payload = {
    model: opts.model,
    messages: opts.messages,
    stream: true,
    ...(opts.sessionId ? { sessionId: opts.sessionId } : {}),
    ...(opts.think !== undefined ? { think: opts.think } : {}),
    ...(opts.useKnowledgeBase === false ? { useKnowledgeBase: false } : {}),
    ...(opts.collection ? { collection: opts.collection } : {}),
  }
  let body: BodyInit
  const headers: Record<string, string> = { Accept: 'text/event-stream' }
  if (opts.images?.length) {
    // Com imagem, a pergunta vai como formulário: as imagens e o resto em JSON.
    const form = new FormData()
    for (const image of opts.images) form.append('images', image)
    form.append('payload', JSON.stringify(payload))
    body = form
  } else {
    headers['Content-Type'] = 'application/json'
    body = JSON.stringify(payload)
  }

  const res = await fetch('/api/ollama/chat', { method: 'POST', headers, body, signal: opts.signal })
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
  let doneReason: string | undefined
  for (;;) {
    const { value, done } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const { events, rest } = parseSseChunk(buffer)
    buffer = rest
    for (const event of events) {
      const error = chatStreamErrorMessage(event)
      if (error) throw new Error(error)
      const e = event as {
        message?: { content?: string; thinking?: string }
        sources?: AskSource[]
        done_reason?: string
      }
      if (e.message?.thinking) opts.onThinking?.(e.message.thinking)
      if (e.message?.content) opts.onText(e.message.content)
      if (Array.isArray(e.sources)) opts.onSources(e.sources)
      if (e.done_reason) doneReason = e.done_reason
    }
  }
  opts.onDone?.(doneReason)
}
