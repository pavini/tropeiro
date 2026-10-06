import * as assert from 'node:assert/strict'
import { test } from 'node:test'
import { cpSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { ContentUpdateService, type ContentFetcher } from '../../app/services/content_update_service.js'
import { activeContentDir, contentDir, localFileShas, type LoadedContent } from '../../app/content/loader.js'
import { gitBlobSha } from '../../app/utils/conteudo_atualizacao.js'

const REPO = { owner: 'o', repo: 'r', branch: 'tropeiro', path: 'conteudo' }

/** Pastas temporárias: o conteúdo que "veio com o Tropeiro" é uma cópia do real. */
function setup() {
  const root = mkdtempSync(join(tmpdir(), 'tropeiro-conteudo-'))
  const bundled = join(root, 'bundled')
  cpSync(contentDir(), bundled, { recursive: true })
  return { root, bundled, downloaded: join(root, 'storage', 'conteudo'), stateFile: join(root, 'storage', 'estado.json') }
}

/** "GitHub" que serve os arquivos de uma pasta, com mudanças por cima. */
function fakeGithub(baseDir: string, changes: Record<string, string | null> = {}, corrupt?: string): ContentFetcher {
  const files = new Map<string, Uint8Array>()
  for (const path of localFileShas(baseDir).keys()) files.set(path, readFileSync(join(baseDir, path)))
  for (const [path, text] of Object.entries(changes)) {
    if (text === null) files.delete(path)
    else files.set(path, Buffer.from(text))
  }
  return {
    async json(url) {
      if (url.endsWith('/trees/tropeiro')) return { tree: [{ path: 'conteudo', type: 'tree', sha: 'T' }] }
      return { tree: [...files].map(([path, bytes]) => ({ path, type: 'blob', sha: gitBlobSha(bytes), size: bytes.length })) }
    },
    async bytes(url) {
      const path = decodeURIComponent(url.split('/tropeiro/conteudo/')[1])
      if (path === corrupt) return Buffer.from('outra coisa')
      return files.get(path)!
    },
  }
}

const service = (env: ReturnType<typeof setup>, fetcher: ContentFetcher, applied: LoadedContent[] = []) =>
  new ContentUpdateService({
    fetcher,
    repo: REPO,
    bundledDir: env.bundled,
    downloadedDir: env.downloaded,
    stateFile: env.stateFile,
    enabled: true,
    onApplied: async (loaded) => void applied.push(loaded),
  })

const queimadura = () => readFileSync(join(contentDir(), 'saude', 'queimadura.md'), 'utf-8')

test('igual ao GitHub: em dia, nada baixado', async () => {
  const env = setup()
  const state = await service(env, fakeGithub(env.bundled)).check()
  assert.equal(state.lastResult, 'em-dia')
  assert.equal(activeContentDir({ ...env, enabled: true }), env.bundled)
})

test('ficha corrigida no GitHub: baixa, valida, troca e passa a valer', async () => {
  const env = setup()
  const applied: LoadedContent[] = []
  const novo = queimadura().replace('Não use gelo.', 'Não use gelo nem água gelada.')
  const state = await service(env, fakeGithub(env.bundled, { 'saude/queimadura.md': novo }), applied).check()
  assert.equal(state.lastResult, 'atualizado', state.lastMessage)
  assert.match(state.lastMessage!, /1 arquivo\(s\) novo\(s\) ou alterado\(s\), 0 removido\(s\)/)
  assert.equal(applied.length, 1)
  const ficha = applied[0].fichas.find((f) => f.slug === 'queimadura')!
  assert.ok(ficha.sections.some((s) => s.items.includes('Não use gelo nem água gelada.')))
  assert.equal(activeContentDir({ ...env, enabled: true }), env.downloaded)
  // de novo: já em dia, a partir da pasta baixada
  assert.equal((await service(env, fakeGithub(env.bundled, { 'saude/queimadura.md': novo })).check()).lastResult, 'em-dia')
})

test('conteúdo inválido no GitHub: nada muda', async () => {
  const env = setup()
  const applied: LoadedContent[] = []
  const quebrado = queimadura().replace(/^titulo: .*$/m, '')
  const state = await service(env, fakeGithub(env.bundled, { 'saude/queimadura.md': quebrado }), applied).check()
  assert.equal(state.lastResult, 'invalido')
  assert.match(state.lastMessage!, /saude\/queimadura\.md: falta o campo "titulo"/)
  assert.equal(applied.length, 0)
  assert.equal(activeContentDir({ ...env, enabled: true }), env.bundled)
})

test('arquivo que chega diferente do esperado: nada muda', async () => {
  const env = setup()
  const novo = queimadura().replace('Não use gelo.', 'Não use gelo!')
  const state = await service(env, fakeGithub(env.bundled, { 'saude/queimadura.md': novo }, 'saude/queimadura.md')).check()
  assert.equal(state.lastResult, 'erro')
  assert.match(state.lastMessage!, /chegou diferente do esperado/)
})

test('formato mais novo do que este Tropeiro lê: espera atualizar o Tropeiro', async () => {
  const env = setup()
  const state = await service(env, fakeGithub(env.bundled, { 'formato.yml': 'versao: 2\n' })).check()
  assert.equal(state.lastResult, 'formato-novo')
})

test('Tropeiro atualizado depois do download: vale o conteúdo que veio com ele', async () => {
  const env = setup()
  const novo = queimadura().replace('Não use gelo.', 'Não use gelo nem água gelada.')
  await service(env, fakeGithub(env.bundled, { 'saude/queimadura.md': novo })).check()
  assert.equal(activeContentDir({ ...env, enabled: true }), env.downloaded)
  // nova versão do Tropeiro traz outro conteúdo junto
  writeFileSync(join(env.bundled, 'saude', 'queimadura.md'), queimadura().replace('Não fure as bolhas.', 'Não estoure as bolhas.'))
  assert.equal(activeContentDir({ ...env, enabled: true }), env.bundled)
})

test('desativado (desenvolvimento): não busca nada', async () => {
  const env = setup()
  const s = new ContentUpdateService({ fetcher: fakeGithub(env.bundled), repo: REPO, bundledDir: env.bundled, downloadedDir: env.downloaded, stateFile: env.stateFile, enabled: false })
  assert.equal((await s.check()).lastResult, 'desativado')
})
