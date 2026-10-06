import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { parse as parseYaml } from 'yaml'
import { parseContent, toFicha } from '../utils/conteudo.js'
import { contentSetHash, gitBlobSha, isContentPath } from '../utils/conteudo_atualizacao.js'
import type { ContentItem, ContentProblem, ContentTheme } from '../../types/conteudo.js'
import type { Ficha, ReferenceDoc } from '../../types/fichas.js'

/**
 * Lê a pasta conteudo/ (Markdown, fontes.yml e temas.yml) uma vez, quando o
 * servidor sobe. Arquivo com problema fica de fora e o problema vai para o log;
 * o validador (npm run conteudo:validar) impede que isso chegue a um PR.
 */

/** A pasta conteudo/ que veio com esta versão do Tropeiro: na raiz do repositório, ou ao lado do app na imagem Docker. */
export function contentDir(): string {
  const candidates = [process.env.TROPEIRO_CONTEUDO_DIR, join(process.cwd(), 'conteudo'), join(process.cwd(), '..', 'conteudo')]
  const dir = candidates.find((d) => d && existsSync(join(d, 'fontes.yml')))
  if (!dir) throw new Error(`pasta conteudo/ não encontrada (procurei em ${candidates.filter(Boolean).join(', ')})`)
  return dir
}

/** Arquivos de conteúdo: conteudo/<tema>/<slug>.md, fora de modelos/ e de nomes começando com _. */
export function contentFiles(dir: string): string[] {
  return readdirSync(dir)
    .filter((theme) => !theme.startsWith('_') && theme !== 'modelos' && statSync(join(dir, theme)).isDirectory())
    .flatMap((theme) =>
      readdirSync(join(dir, theme))
        .filter((f) => f.endsWith('.md') && !f.startsWith('_'))
        .map((f) => join(dir, theme, f))
    )
    .sort()
}

/** fontes.yml, com os nomes de campo em português, para o formato interno. */
export function parseSources(text: string): ReferenceDoc[] {
  const list = parseYaml(text)
  if (!Array.isArray(list)) throw new Error('fontes.yml deve ser uma lista')
  return list.map((d: any) => ({
    id: String(d.id),
    title: String(d.titulo),
    publisher: String(d.publicador),
    year: Number(d.ano),
    theme: String(d.tema),
    audience: d.publico === 'profissional' ? 'professional' : 'public',
    ...(d.formato === 'html' ? { format: 'html' as const } : {}),
    url: String(d.url),
    sha256: d.sha256 ? String(d.sha256) : '',
    sizeBytes: d.tamanho ? Number(d.tamanho) : 0,
    ...(d.trechos ? { mustContain: (d.trechos as unknown[]).map(String) } : {}),
    license: String(d.licenca ?? ''),
  }))
}

export function parseThemes(text: string): ContentTheme[] {
  const list = parseYaml(text)
  if (!Array.isArray(list)) throw new Error('temas.yml deve ser uma lista')
  return list.map((t: any) => ({ id: String(t.id), title: String(t.titulo), description: String(t.descricao ?? '') }))
}

/** Impressão (do git) de cada arquivo que o Tropeiro lê, pelo caminho relativo a conteudo/. */
export function localFileShas(dir: string): Map<string, string> {
  const out = new Map<string, string>()
  const walk = (sub: string) => {
    for (const name of readdirSync(join(dir, sub))) {
      const rel = sub ? `${sub}/${name}` : name
      if (statSync(join(dir, rel)).isDirectory()) {
        if (!name.startsWith('.')) walk(rel)
      } else if (isContentPath(rel)) out.set(rel, gitBlobSha(readFileSync(join(dir, rel))))
    }
  }
  walk('')
  return out
}

/** Conteúdo baixado pela internet (ContentUpdateService) e o registro do último download. */
export const DOWNLOADED_DIR = join(process.cwd(), 'storage', 'conteudo')
export const UPDATE_STATE_FILE = join(process.cwd(), 'storage', 'conteudo-atualizacao.json')

export interface UpdateState {
  /** Impressão do conteúdo baixado em uso. */
  version?: string
  /** Impressão do conteúdo que veio com o Tropeiro quando o download foi feito. */
  base?: string
  updatedAt?: string
  lastCheckAt?: string
  lastResult?: 'em-dia' | 'atualizado' | 'invalido' | 'formato-novo' | 'sem-internet' | 'erro' | 'desativado'
  lastMessage?: string
}

export function readUpdateState(file = UPDATE_STATE_FILE): UpdateState {
  try {
    return JSON.parse(readFileSync(file, 'utf-8'))
  } catch {
    return {}
  }
}

/** Em desenvolvimento vale a pasta do repositório, que você está editando; nada é baixado. */
export function contentUpdatesEnabled(): boolean {
  if (process.env.TROPEIRO_CONTEUDO_ATUALIZAR === '1') return true
  if (process.env.TROPEIRO_CONTEUDO_ATUALIZAR === '0') return false
  return process.env.NODE_ENV === 'production'
}

/**
 * A pasta que vale agora: a baixada, se houver e se o Tropeiro não tiver sido
 * atualizado depois do download (aí vale o conteúdo que veio com a versão
 * nova); senão, a que veio com o Tropeiro.
 */
export function activeContentDir(
  opts: { bundled?: string; downloaded?: string; stateFile?: string; enabled?: boolean } = {}
): string {
  const bundled = opts.bundled ?? contentDir()
  const downloaded = opts.downloaded ?? DOWNLOADED_DIR
  if (!(opts.enabled ?? contentUpdatesEnabled()) || !existsSync(join(downloaded, 'fontes.yml'))) return bundled
  const state = readUpdateState(opts.stateFile ?? UPDATE_STATE_FILE)
  return state.base && state.base === contentSetHash(localFileShas(bundled)) ? downloaded : bundled
}

export interface LoadedContent {
  dir: string
  /** Versão do formato (conteudo/formato.yml). */
  format: number
  sources: ReferenceDoc[]
  themes: ContentTheme[]
  items: ContentItem[]
  fichas: Ficha[]
  problems: ContentProblem[]
}

export function loadContent(dir = contentDir()): LoadedContent {
  const sources = parseSources(readFileSync(join(dir, 'fontes.yml'), 'utf-8'))
  const themes = existsSync(join(dir, 'temas.yml')) ? parseThemes(readFileSync(join(dir, 'temas.yml'), 'utf-8')) : []
  const items: ContentItem[] = []
  const fichas: Ficha[] = []
  const problems: ContentProblem[] = []
  for (const path of contentFiles(dir)) {
    const file = relative(dir, path)
    const parsed = parseContent(readFileSync(path, 'utf-8'), file)
    problems.push(...parsed.problems)
    if (!parsed.item) continue
    if (parsed.item.type === 'ficha') {
      const { ficha, problems: fp } = toFicha(parsed.item)
      problems.push(...fp)
      if (!ficha) continue
      fichas.push(ficha)
    }
    items.push(parsed.item)
  }
  const formatFile = join(dir, 'formato.yml')
  const format = existsSync(formatFile) ? Number(parseYaml(readFileSync(formatFile, 'utf-8'))?.versao ?? 1) : 1
  return { dir, format, sources, themes, items, fichas, problems }
}
