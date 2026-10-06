/**
 * Apps da interface nova: nome e explicação em linguagem simples, grupo e
 * estado de cada app. Sem dependências, para poder testar. Os textos são
 * chaves de tradução.
 */

export interface NovoApp {
  name: string
  label: string
  description: string | null
  isCustom: boolean
  installed: boolean
  installation: 'idle' | 'installing' | 'error'
  /** Estado do contêiner no Docker (running, exited, created, restarting...). */
  status: string
  uiLocation: string | null
  customUrl: string | null
  /** Só na IA: usa um Ollama em outro endereço, e o contêiner local fica parado de propósito. */
  remoteAi?: boolean
}

export type AppGroup = 'essentials' | 'communication' | 'organization' | 'learning' | 'tools' | 'own'

export type AppState = 'installing' | 'running' | 'starting' | 'stopped' | 'failed' | 'available' | 'remote'

interface AppInfo {
  title: string
  what: string
  group: AppGroup
  /** Onde abrir na interface nova, no lugar do endereço do app. */
  href?: string
  /** Tela de ajustes do app na interface nova. */
  settingsHref?: string
}

const INFO: Record<string, AppInfo> = {
  nomad_kiwix_server: { title: 'Information Library', what: 'Wikipedia, manuals and guides, searchable without internet.', group: 'essentials', href: '/' },
  nomad_ollama: { title: 'AI Assistant', what: 'Answers questions using the content on this server.', group: 'essentials', href: '/perguntar', settingsHref: '/ia' },
  nomad_translate: { title: 'Translated Library', what: 'Reads library books in another language, translated on this server.', group: 'essentials' },
  nomad_meshtastic_web: { title: 'Radio messages (Meshtastic)', what: 'Send messages over Meshtastic radios, without internet or phone signal.', group: 'communication' },
  nomad_meshcore_web: { title: 'Radio messages (MeshCore)', what: 'Send messages over MeshCore radios, without internet or phone signal.', group: 'communication' },
  nomad_flatnotes: { title: 'Notes', what: 'Write and keep notes on the server.', group: 'organization' },
  nomad_homebox: { title: 'Inventory', what: 'Keep track of supplies, tools and everything you own.', group: 'organization' },
  nomad_filebrowser: { title: 'Files', what: 'Browse, send and download files on the server.', group: 'organization' },
  nomad_vaultwarden: { title: 'Passwords', what: 'Keep passwords safe on the server.', group: 'organization' },
  nomad_excalidraw: { title: 'Whiteboard', what: 'Draw sketches, plans and diagrams.', group: 'organization' },
  nomad_kolibri_2: { title: 'School lessons', what: 'Video lessons and exercises for students.', group: 'learning' },
  nomad_kolibri: { title: 'School lessons (old version)', what: 'Video lessons and exercises for students.', group: 'learning' },
  nomad_calibreweb: { title: 'E-books', what: 'Read and organize e-books.', group: 'learning' },
  nomad_jellyfin: { title: 'Videos and music', what: 'Watch videos and listen to music saved on the server.', group: 'learning' },
  nomad_stirling_pdf: { title: 'PDF tools', what: 'Join, split, compress and convert PDFs.', group: 'tools' },
  nomad_cyberchef: { title: 'Data Tools', what: 'Encode, decode and analyze data. For technical users.', group: 'tools' },
  nomad_it_tools: { title: 'Technical tools', what: 'Small utilities for programmers.', group: 'tools' },
}

export const GROUP_ORDER: AppGroup[] = ['essentials', 'communication', 'organization', 'learning', 'tools', 'own']

export const GROUP_LABEL: Record<AppGroup, string> = {
  essentials: 'Essentials',
  communication: 'Communication',
  organization: 'Organization',
  learning: 'Learning and media',
  tools: 'Tools',
  own: 'Your own apps',
}

/**
 * Título e explicação do app. `translated` diz se são chaves de tradução:
 * apps próprios mostram o nome e a descrição como foram cadastrados.
 */
export function appInfo(app: NovoApp): {
  title: string
  what: string | null
  group: AppGroup
  href?: string
  settingsHref?: string
  translated: boolean
} {
  if (app.isCustom) return { title: app.label, what: app.description, group: 'own', translated: false }
  const info = INFO[app.name]
  if (info) return { ...info, translated: true }
  return { title: app.label, what: app.description, group: 'tools', translated: true }
}

export function appState(app: NovoApp): AppState {
  if (app.installation === 'installing') return 'installing'
  // IA em outro endereço: o contêiner local parado não é problema, e iniciá-lo
  // brigaria pela porta 11434 com o Ollama externo.
  if (app.remoteAi) return 'remote'
  if (!app.installed) return app.installation === 'error' ? 'failed' : 'available'
  if (app.status === 'running') return 'running'
  if (app.status === 'restarting' || app.status === 'created') return 'starting'
  return 'stopped'
}

/** Apps agrupados na ordem da tela, sem grupos vazios. */
export function groupApps(apps: NovoApp[]): { group: AppGroup; apps: NovoApp[] }[] {
  return GROUP_ORDER.map((group) => ({ group, apps: apps.filter((a) => appInfo(a).group === group) })).filter(
    (g) => g.apps.length > 0
  )
}
