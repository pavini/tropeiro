/**
 * Regras do estado do servidor: transforma os dados brutos em itens com nível
 * (ok, aviso, problema ou informação), texto e o que fazer. Sem dependências,
 * para poder testar. Os textos são chaves de tradução.
 */

export type HealthLevel = 'ok' | 'info' | 'warn' | 'error'

export interface HealthCheck {
  id: string
  level: HealthLevel
  title: string
  titleParams?: Record<string, string | number>
  detail?: string
  detailParams?: Record<string, string | number>
  action?: { href: string; label: string }
}

export interface HealthInput {
  library: { installed: boolean; reachable: boolean; books: number }
  ai: {
    installed: boolean
    model: string | null
    /** IA em outro endereço; null ou ausente quando roda neste servidor. */
    remote?: { url: string; reachable: boolean } | null
  }
  /** Apps instalados que não estão rodando. */
  stoppedApps: string[]
  downloads: { workerAlive: boolean | null; active: number; failed: number } | null
  /** Espaço livre e total do disco, em bytes; null se não deu para medir. */
  disk: { free: number; total: number } | null
  references: {
    total: number
    available: number
    /** Documentos baixados que a IA já leu; null sem IA instalada. */
    ai?: { total: number; ready: number; failed: number } | null
  }
  online: boolean
}

const GB = 1024 ** 3
const AI_SERVICE = 'nomad_ollama'

export function healthChecks(input: HealthInput): HealthCheck[] {
  const checks: HealthCheck[] = []
  const setup = { href: '/montar', label: 'Set up the server' }

  // Biblioteca
  if (!input.library.installed) {
    checks.push({ id: 'library', level: 'warn', title: 'No library on this server yet', detail: 'Without it there is no encyclopedia or manuals to search.', action: setup })
  } else if (!input.library.reachable) {
    checks.push({ id: 'library', level: 'error', title: 'The library is not responding', detail: 'Search and articles do not work until it comes back. Restarting the library in the apps screen usually solves it.', action: { href: '/apps', label: 'Open the apps' } })
  } else if (input.library.books === 0) {
    checks.push({ id: 'library', level: 'warn', title: 'The library is empty', detail: 'Choose a kit to download content.', action: setup })
  } else {
    checks.push({ id: 'library', level: 'ok', title: 'Library working', detail: '{{count}} books available', detailParams: { count: input.library.books } })
  }

  // IA
  const aiSettings = { href: '/ia', label: 'Open the AI settings' }
  const remote = input.ai.remote
  if (remote && !remote.reachable) {
    checks.push({ id: 'ai', level: 'error', title: 'The AI at another address is not responding', detail: 'Address: {{url}}. Questions to the AI do not work until it comes back.', detailParams: { url: remote.url }, action: aiSettings })
  } else if (remote && !input.ai.model) {
    checks.push({ id: 'ai', level: 'warn', title: 'AI without a model', detail: 'The AI at another address has no model to answer with.', action: { href: '/ia', label: 'Choose a model' } })
  } else if (remote) {
    checks.push({ id: 'ai', level: 'ok', title: 'AI at another address', detail: 'Model: {{model}}', detailParams: { model: input.ai.model! }, action: aiSettings })
  } else if (!input.ai.installed) {
    checks.push({ id: 'ai', level: 'info', title: 'AI not installed', detail: 'Optional. Without it, everything else works.', action: { href: '/apps', label: 'Open the apps' } })
  } else if (!input.ai.model) {
    checks.push({ id: 'ai', level: 'warn', title: 'AI without a model', detail: 'The AI is installed but has no model to answer with.', action: { href: '/ia', label: 'Choose a model' } })
  } else {
    checks.push({ id: 'ai', level: 'ok', title: 'AI ready', detail: 'Model: {{model}}', detailParams: { model: input.ai.model } })
  }

  // Apps parados
  if (input.stoppedApps.length > 0) {
    checks.push({ id: 'apps', level: 'warn', title: 'Stopped apps: {{names}}', titleParams: { names: input.stoppedApps.join(', ') }, detail: 'They can be started again in the apps screen.', action: { href: '/apps', label: 'Open the apps' } })
  } else {
    checks.push({ id: 'apps', level: 'ok', title: 'All installed apps running' })
  }

  // Downloads
  const dl = input.downloads
  if (dl) {
    const pending = dl.active > 0
    if (pending && dl.workerAlive === false) {
      checks.push({ id: 'downloads', level: 'error', title: 'Downloads are stopped', detail: 'The process that downloads the files is not responding. It usually comes back on its own within a few minutes; if it does not, restart the server.', action: { href: '/montar', label: 'See downloads' } })
    } else if (dl.failed > 0) {
      checks.push({ id: 'downloads', level: 'warn', title: '{{count}} downloads failed', titleParams: { count: dl.failed }, detail: 'They can be tried again in the classic content manager.', action: { href: '/montar', label: 'See downloads' } })
    } else if (pending) {
      checks.push({ id: 'downloads', level: 'info', title: 'Downloading {{count}} items', titleParams: { count: dl.active }, action: { href: '/montar', label: 'See downloads' } })
    } else {
      checks.push({ id: 'downloads', level: 'ok', title: 'No downloads pending' })
    }
  }

  // Disco
  if (input.disk && input.disk.total > 0) {
    const ratio = input.disk.free / input.disk.total
    const free = Math.round((input.disk.free / GB) * 10) / 10
    const level: HealthLevel = ratio < 0.1 ? 'error' : ratio < 0.2 ? 'warn' : 'ok'
    checks.push({
      id: 'disk',
      level,
      title: level === 'ok' ? 'Disk space is fine' : 'Little disk space left',
      detail: '{{free}} GB free',
      detailParams: { free },
      ...(level === 'ok' ? {} : { action: { href: '/conteudo', label: 'Free up space' } }),
    })
  }

  // Documentos das fichas
  const missing = input.references.total - input.references.available
  if (missing > 0) {
    checks.push({
      id: 'references',
      level: input.online ? 'info' : 'warn',
      title: '{{count}} reference documents not downloaded yet',
      titleParams: { count: missing },
      detail: input.online ? 'They are downloaded automatically.' : 'They will be downloaded when there is internet.',
    })
  } else {
    checks.push({ id: 'references', level: 'ok', title: 'Reference documents available offline' })
  }

  // Documentos oficiais na base de conhecimento da IA
  const ai = input.references.ai
  if (ai && ai.total > 0) {
    if (ai.failed > 0) {
      checks.push({
        id: 'references-ai',
        level: 'warn',
        title: 'The AI could not read {{count}} official documents',
        titleParams: { count: ai.failed },
        detail: 'It tries again within an hour. Meanwhile, answers do not use them.',
      })
    } else if (ai.ready < ai.total) {
      checks.push({
        id: 'references-ai',
        level: 'info',
        title: 'The AI is reading the official documents: {{ready}} of {{total}}',
        titleParams: { ready: ai.ready, total: ai.total },
        detail: 'Until it finishes, answers may be slower and do not cite every document yet.',
      })
    } else {
      checks.push({
        id: 'references-ai',
        level: 'ok',
        title: 'Official documents ready for the AI',
        detail: 'Health answers cite the Ministry of Health manuals, with the page.',
      })
    }
  }

  // Internet não é problema: o servidor existe para funcionar sem ela.
  checks.push(
    input.online
      ? { id: 'internet', level: 'ok', title: 'Connected to the internet' }
      : { id: 'internet', level: 'info', title: 'No internet', detail: 'Everything keeps working with what is already downloaded.' }
  )

  return checks
}

/**
 * Apps instalados que não estão rodando. Com a IA em outro endereço, o
 * contêiner local da IA fica parado de propósito e não conta.
 */
export function stoppedServices<T extends { name: string; status: string }>(services: T[], remoteAi: boolean): T[] {
  return services.filter((s) => s.status !== 'running' && !(remoteAi && s.name === AI_SERVICE))
}

/** Pior nível da lista: define o resumo do topo. */
export function overallLevel(checks: HealthCheck[]): HealthLevel {
  const order: HealthLevel[] = ['ok', 'info', 'warn', 'error']
  return checks.reduce<HealthLevel>((worst, c) => (order.indexOf(c.level) > order.indexOf(worst) ? c.level : worst), 'ok')
}
