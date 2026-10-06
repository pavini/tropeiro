/**
 * Regras da tela de inteligência artificial: onde a IA roda e o que falta para
 * ela funcionar. Sem dependências, para poder testar. Os textos são chaves de
 * tradução.
 */

export type AiNoticeLevel = 'ok' | 'info' | 'warn' | 'error'

export interface AiNotice {
  id: string
  level: AiNoticeLevel
  title: string
  titleParams?: Record<string, string | number>
  detail?: string
  detailParams?: Record<string, string | number>
  action?: { href: string; label: string }
}

export interface AiInput {
  /** IA em outro endereço; null quando roda neste servidor. */
  remote: { url: string; reachable: boolean } | null
  /** Ollama no Docker deste servidor. */
  local: { installed: boolean; running: boolean }
  /** Modelos de conversa da IA em uso. */
  models: string[]
  /** A IA em uso tem o modelo que lê os documentos. */
  embedding: boolean
  /** Nome do modelo que lê os documentos, para mostrar o comando. */
  embeddingModel: string
}

export type AiWhere = 'remote' | 'local' | 'none'

export function aiWhere(input: Pick<AiInput, 'remote' | 'local'>): AiWhere {
  if (input.remote) return 'remote'
  return input.local.installed ? 'local' : 'none'
}

/** A IA em uso está respondendo (ou deveria estar, no caso local). */
export function aiReachable(input: Pick<AiInput, 'remote' | 'local'>): boolean {
  if (input.remote) return input.remote.reachable
  return input.local.installed && input.local.running
}

/**
 * Endereço digitado, arrumado: sem espaços nem barra no fim, com http:// se
 * faltar. null se não for um endereço http(s) válido.
 */
export function normalizeAiUrl(raw: string): string | null {
  const text = raw.trim()
  if (!text) return null
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(text) ? text : `http://${text}`
  let url: URL
  try {
    url = new URL(withScheme)
  } catch {
    return null
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
  if (!url.hostname) return null
  return `${url.protocol}//${url.host}${url.pathname}`.replace(/\/+$/, '')
}

/** Avisos da tela, do mais importante ao menos. Vazio quando está tudo certo. */
export function aiNotices(input: AiInput): AiNotice[] {
  const where = aiWhere(input)
  const apps = { href: '/apps', label: 'Open the apps' }
  const download = { href: '/settings/models', label: 'Download a model' }

  if (where === 'none') {
    return [
      {
        id: 'none',
        level: 'info',
        title: 'The AI is not installed on this server',
        detail: 'Install the AI Assistant in the apps screen, or use an AI at another address.',
        action: apps,
      },
    ]
  }
  if (where === 'local' && !input.local.running) {
    return [
      {
        id: 'stopped',
        level: 'warn',
        title: 'The AI on this server is stopped',
        detail: 'Start the AI Assistant in the apps screen.',
        action: apps,
      },
    ]
  }
  if (where === 'remote' && !input.remote!.reachable) {
    return [
      {
        id: 'unreachable',
        level: 'error',
        title: 'The AI at {{url}} is not responding',
        titleParams: { url: input.remote!.url },
        detail: 'Check that the computer is on, that Ollama is open and that it accepts connections from the network (OLLAMA_HOST=0.0.0.0).',
      },
    ]
  }

  const notices: AiNotice[] = []
  if (input.models.length === 0) {
    notices.push(
      where === 'remote'
        ? {
            id: 'no-model',
            level: 'warn',
            title: 'No model to answer with',
            detail: 'Download a model on the computer at that address, for example: {{command}}',
            detailParams: { command: 'ollama pull qwen3:4b' },
          }
        : {
            id: 'no-model',
            level: 'warn',
            title: 'No model to answer with',
            detail: 'Download one in the advanced administration.',
            action: download,
          }
    )
  }
  if (!input.embedding) {
    notices.push(
      where === 'remote'
        ? {
            id: 'no-embedding',
            level: 'warn',
            title: 'The AI cannot read the documents',
            detail: 'Without the reading model, the AI does not search the content of this server. On the computer at that address, run: {{command}}',
            detailParams: { command: `ollama pull ${input.embeddingModel}` },
          }
        : {
            id: 'no-embedding',
            level: 'warn',
            title: 'The AI cannot read the documents',
            detail: 'Without the reading model, the AI does not search the content of this server. It is downloaded automatically when there is internet; you can also download {{model}} in the advanced administration.',
            detailParams: { model: input.embeddingModel },
            action: download,
          }
    )
  }
  return notices
}

/**
 * Linha dos documentos oficiais na base de conhecimento da IA. `status` vem
 * de ReferenceDocsService.aiStatus(): null quando falta a IA ou a base.
 */
export function referencesNotice(status: { total: number; ready: number; failed: number } | null): AiNotice {
  if (!status) {
    return {
      id: 'references',
      level: 'info',
      title: 'The AI does not read the official documents yet',
      detail: 'It needs the AI and the knowledge base working.',
    }
  }
  if (status.total === 0) {
    return { id: 'references', level: 'info', title: 'No official documents downloaded yet', detail: 'They are downloaded automatically when there is internet.' }
  }
  if (status.failed > 0) {
    return {
      id: 'references',
      level: 'warn',
      title: 'The AI could not read {{count}} official documents',
      titleParams: { count: status.failed },
      detail: 'It tries again within an hour. Meanwhile, answers do not use them.',
    }
  }
  if (status.ready < status.total) {
    return {
      id: 'references',
      level: 'info',
      title: 'The AI is reading the official documents: {{ready}} of {{total}}',
      titleParams: { ready: status.ready, total: status.total },
      detail: 'Until it finishes, answers may be slower and do not cite every document yet.',
    }
  }
  return {
    id: 'references',
    level: 'ok',
    title: 'Official documents ready for the AI',
    detail: 'Health answers cite the Ministry of Health manuals, with the page.',
  }
}

/** Modelos de um endereço testado que servem para conversar, e se há o de leitura. */
export function splitModels(names: string[]): { chat: string[]; embedding: boolean } {
  return {
    chat: names.filter((n) => !n.includes('embed')),
    embedding: names.some((n) => n.toLowerCase().includes('nomic-embed-text')),
  }
}
