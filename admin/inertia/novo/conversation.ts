/** Conversas guardadas com a IA: o que vai e volta do servidor. */

/** Pedido para continuar uma resposta cortada; não aparece como pergunta na conversa. */
export const CONTINUE_PROMPT = 'Continue exatamente de onde parou, sem repetir o que já escreveu.'

/** Mensagens guardadas viram turnos; os pedidos de "continuar" se juntam à resposta anterior. */
export function turnsFromMessages<S>(
  messages: { role: string; content: string; sources: S[] }[]
): { question: string; answer: string; sources: S[] }[] {
  const turns: { question: string; answer: string; sources: S[] }[] = []
  let continuing = false
  for (const m of messages) {
    if (m.role === 'user') {
      continuing = m.content === CONTINUE_PROMPT || m.content === LEGACY_CONTINUE_PROMPT
      if (!continuing) turns.push({ question: m.content, answer: '', sources: [] })
    } else if (m.role === 'assistant' && turns.length) {
      const last = turns[turns.length - 1]
      last.answer = continuing && last.answer ? `${last.answer}${m.content}` : m.content
      if (m.sources?.length) last.sources = m.sources
    }
  }
  return turns
}

/** O pedido de "continuar" do chat clássico, em inglês. */
const LEGACY_CONTINUE_PROMPT = 'Continue exactly where you left off. Do not repeat what you already wrote.'
