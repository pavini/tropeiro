import { existsSync } from 'node:fs'
import { cp, mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import axios from 'axios'
import {
  DOWNLOADED_DIR,
  UPDATE_STATE_FILE,
  activeContentDir,
  contentDir,
  contentUpdatesEnabled,
  loadContent,
  localFileShas,
  type LoadedContent,
  type UpdateState,
} from '../content/loader.js'
import { validateContent } from '../utils/conteudo_validacao.js'
import { contentSetHash, gitBlobSha, isContentPath, planUpdate, type RemoteFile } from '../utils/conteudo_atualizacao.js'
import { CONTENT_FORMAT_VERSION, TROPEIRO_CONTENT_REPO } from '../../constants/tropeiro.js'

/** Acesso à rede, trocável nos testes. */
export interface ContentFetcher {
  json(url: string): Promise<any>
  bytes(url: string): Promise<Uint8Array>
}

const TIMEOUT_MS = 30_000

const httpFetcher: ContentFetcher = {
  async json(url) {
    const res = await axios.get(url, {
      timeout: TIMEOUT_MS,
      headers: { 'Accept': 'application/vnd.github+json', 'User-Agent': 'Tropeiro' },
    })
    return res.data
  },
  async bytes(url) {
    const res = await axios.get<ArrayBuffer>(url, { timeout: TIMEOUT_MS, responseType: 'arraybuffer', headers: { 'User-Agent': 'Tropeiro' } })
    return new Uint8Array(res.data)
  },
}

export interface ContentUpdateOptions {
  fetcher?: ContentFetcher
  repo?: typeof TROPEIRO_CONTENT_REPO
  bundledDir?: string
  downloadedDir?: string
  stateFile?: string
  enabled?: boolean
  /** O que fazer com o conteúdo novo, já validado (no servidor: recarregar, reler na IA, baixar documentos). */
  onApplied?: (loaded: LoadedContent) => Promise<void>
}

/**
 * Atualização do conteúdo pela internet. Busca no GitHub a pasta conteudo/ da
 * branch principal, baixa só o que mudou, valida tudo numa pasta à parte com o
 * mesmo validador dos PRs e só então troca o conteúdo em uso. Se algo falhar,
 * o servidor continua com o que já tinha.
 */
export class ContentUpdateService {
  private static running: Promise<UpdateState> | null = null

  private fetcher: ContentFetcher
  private repo: typeof TROPEIRO_CONTENT_REPO
  private bundledDir: string
  private downloadedDir: string
  private stateFile: string
  private enabled: boolean
  private onApplied: (loaded: LoadedContent) => Promise<void>

  constructor(opts: ContentUpdateOptions = {}) {
    this.fetcher = opts.fetcher ?? httpFetcher
    this.repo = opts.repo ?? TROPEIRO_CONTENT_REPO
    this.bundledDir = opts.bundledDir ?? contentDir()
    this.downloadedDir = opts.downloadedDir ?? DOWNLOADED_DIR
    this.stateFile = opts.stateFile ?? UPDATE_STATE_FILE
    this.enabled = opts.enabled ?? contentUpdatesEnabled()
    this.onApplied = opts.onApplied ?? applyToServer
  }

  async state(): Promise<UpdateState> {
    try {
      return JSON.parse(await readFile(this.stateFile, 'utf-8'))
    } catch {
      return {}
    }
  }

  /** Procura e aplica conteúdo novo. Chamadas ao mesmo tempo esperam a mesma busca. */
  check(): Promise<UpdateState> {
    if (!ContentUpdateService.running) {
      ContentUpdateService.running = this.run().finally(() => {
        ContentUpdateService.running = null
      })
    }
    return ContentUpdateService.running
  }

  private async run(): Promise<UpdateState> {
    const previous = await this.state()
    const now = new Date().toISOString()
    const save = async (patch: Partial<UpdateState>) => {
      const next = { ...previous, lastCheckAt: now, ...patch }
      await mkdir(dirname(this.stateFile), { recursive: true })
      await writeFile(this.stateFile, JSON.stringify(next, null, 2))
      return next
    }

    if (!this.enabled) {
      return save({ lastResult: 'desativado', lastMessage: 'Em desenvolvimento vale a pasta conteudo/ do repositório; nada é baixado.' })
    }

    let remote: RemoteFile[]
    try {
      remote = await this.remoteFiles()
    } catch (err) {
      const offline = axios.isAxiosError(err) && (!err.response || err.code === 'ECONNABORTED')
      return save({ lastResult: offline ? 'sem-internet' : 'erro', lastMessage: (err as Error).message })
    }

    const currentDir = activeContentDir({
      bundled: this.bundledDir,
      downloaded: this.downloadedDir,
      stateFile: this.stateFile,
      enabled: this.enabled,
    })
    const local = localFileShas(currentDir)
    const remoteVersion = contentSetHash(new Map(remote.filter((f) => isContentPath(f.path)).map((f) => [f.path, f.sha])))
    const plan = planUpdate(remote, local)
    if (plan.download.length === 0 && plan.remove.length === 0) {
      return save({ lastResult: 'em-dia', lastMessage: undefined })
    }

    // Monta o conteúdo novo numa pasta à parte: o que não mudou vem da pasta em uso.
    const staging = `${this.downloadedDir}.novo`
    await rm(staging, { recursive: true, force: true })
    try {
      for (const path of plan.keep) {
        await mkdir(dirname(join(staging, path)), { recursive: true })
        await cp(join(currentDir, path), join(staging, path))
      }
      for (const file of plan.download) {
        const bytes = await this.fetcher.bytes(this.rawUrl(file.path))
        if (gitBlobSha(bytes) !== file.sha) throw new Error(`${file.path} chegou diferente do esperado`)
        await mkdir(dirname(join(staging, file.path)), { recursive: true })
        await writeFile(join(staging, file.path), bytes)
      }

      const loaded = loadContent(staging)
      if (loaded.format > CONTENT_FORMAT_VERSION) {
        await rm(staging, { recursive: true, force: true })
        return save({
          lastResult: 'formato-novo',
          lastMessage: `O conteúdo novo usa o formato ${loaded.format}; esta versão do Tropeiro lê até o ${CONTENT_FORMAT_VERSION}. Atualize o Tropeiro.`,
        })
      }
      const problems = validateContent(loaded)
      if (problems.length) {
        await rm(staging, { recursive: true, force: true })
        return save({
          lastResult: 'invalido',
          lastMessage: problems.slice(0, 3).map((p) => `${p.file}: ${p.message}`).join(' | '),
        })
      }
    } catch (err) {
      await rm(staging, { recursive: true, force: true })
      const offline = axios.isAxiosError(err) && !err.response
      return save({ lastResult: offline ? 'sem-internet' : 'erro', lastMessage: (err as Error).message })
    }

    // Troca de uma vez: a pasta anterior fica guardada até a próxima troca.
    await rm(`${this.downloadedDir}.anterior`, { recursive: true, force: true })
    if (existsSync(this.downloadedDir)) await rename(this.downloadedDir, `${this.downloadedDir}.anterior`)
    await rename(staging, this.downloadedDir)

    const state = await save({
      version: remoteVersion,
      base: contentSetHash(localFileShas(this.bundledDir)),
      updatedAt: now,
      lastResult: 'atualizado',
      lastMessage: `${plan.download.length} arquivo(s) novo(s) ou alterado(s), ${plan.remove.length} removido(s)`,
    })
    await this.onApplied(loadContent(this.downloadedDir))
    return state
  }

  /** Arquivos da pasta conteudo/ no GitHub, com a impressão de cada um. */
  private async remoteFiles(): Promise<RemoteFile[]> {
    const api = `https://api.github.com/repos/${this.repo.owner}/${this.repo.repo}/git/trees`
    const root = await this.fetcher.json(`${api}/${encodeURIComponent(this.repo.branch)}`)
    const folder = (root?.tree ?? []).find((e: any) => e.path === this.repo.path && e.type === 'tree')
    if (!folder) throw new Error(`pasta ${this.repo.path}/ não encontrada no repositório`)
    const tree = await this.fetcher.json(`${api}/${folder.sha}?recursive=1`)
    if (tree?.truncated) throw new Error('lista de arquivos incompleta (pasta grande demais para uma consulta)')
    return (tree?.tree ?? [])
      .filter((e: any) => e.type === 'blob')
      .map((e: any) => ({ path: String(e.path), sha: String(e.sha), size: Number(e.size ?? 0) }))
  }

  private rawUrl(path: string): string {
    const segments = [this.repo.path, ...path.split('/')].map(encodeURIComponent).join('/')
    return `https://raw.githubusercontent.com/${this.repo.owner}/${this.repo.repo}/${encodeURIComponent(this.repo.branch)}/${segments}`
  }
}

/** No servidor: troca o conteúdo em uso, relê na IA o que mudou e baixa documentos novos. */
async function applyToServer(loaded: LoadedContent): Promise<void> {
  const { reloadContent } = await import('../content/index.js')
  reloadContent(loaded)
  const { ContentKbService } = await import('#services/content_kb_service')
  const { ReferenceDocsService } = await import('#services/reference_docs_service')
  await new ContentKbService().sync()
  const docs = new ReferenceDocsService()
  await docs.ensureAll()
  await docs.queueForAi()
}
