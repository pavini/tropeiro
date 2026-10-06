import * as assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  aiNotices,
  aiReachable,
  aiWhere,
  normalizeAiUrl,
  referencesNotice,
  splitModels,
  type AiInput,
} from '../../inertia/novo/ai.js'

const ready: AiInput = {
  remote: null,
  local: { installed: true, running: true },
  models: ['llama3.1:8b'],
  embedding: true,
  embeddingModel: 'nomic-embed-text:v1.5',
}
const remote = (reachable: boolean, patch: Partial<AiInput> = {}): AiInput => ({
  ...ready,
  remote: { url: 'http://192.168.0.20:11434', reachable },
  local: { installed: false, running: false },
  ...patch,
})
const ids = (input: AiInput) => aiNotices(input).map((n) => n.id)

test('onde a IA roda', () => {
  assert.equal(aiWhere(ready), 'local')
  assert.equal(aiWhere(remote(true)), 'remote')
  assert.equal(aiWhere({ ...ready, local: { installed: false, running: false } }), 'none')
  // endereço externo vale mesmo com a IA local instalada
  assert.equal(aiWhere(remote(true, { local: { installed: true, running: false } })), 'remote')
})

test('a IA em uso responde', () => {
  assert.equal(aiReachable(ready), true)
  assert.equal(aiReachable({ ...ready, local: { installed: true, running: false } }), false)
  assert.equal(aiReachable(remote(true)), true)
  assert.equal(aiReachable(remote(false)), false)
})

test('tudo certo: sem avisos', () => {
  assert.deepEqual(ids(ready), [])
  assert.deepEqual(ids(remote(true)), [])
})

test('sem IA, IA local parada e endereço sem resposta', () => {
  assert.deepEqual(ids({ ...ready, local: { installed: false, running: false } }), ['none'])
  assert.deepEqual(ids({ ...ready, local: { installed: true, running: false } }), ['stopped'])
  const down = aiNotices(remote(false))
  assert.deepEqual(down.map((n) => n.id), ['unreachable'])
  assert.equal(down[0].level, 'error')
  assert.equal(down[0].titleParams?.url, 'http://192.168.0.20:11434')
})

test('sem modelo de conversa: externo mostra o comando, local manda baixar', () => {
  const ext = aiNotices(remote(true, { models: [] })).find((n) => n.id === 'no-model')
  assert.equal(ext?.level, 'warn')
  assert.equal(ext?.action, undefined)
  assert.match(String(ext?.detailParams?.command), /^ollama pull /)
  const local = aiNotices({ ...ready, models: [] }).find((n) => n.id === 'no-model')
  assert.equal(local?.action?.href, '/settings/models')
})

test('sem o modelo de leitura: externo mostra o comando com o nome certo', () => {
  const ext = aiNotices(remote(true, { embedding: false })).find((n) => n.id === 'no-embedding')
  assert.equal(ext?.detailParams?.command, 'ollama pull nomic-embed-text:v1.5')
  const local = aiNotices({ ...ready, embedding: false }).find((n) => n.id === 'no-embedding')
  assert.equal(local?.detailParams?.model, 'nomic-embed-text:v1.5')
  assert.equal(local?.action?.href, '/settings/models')
})

test('endereço digitado é arrumado', () => {
  assert.equal(normalizeAiUrl('http://localhost:11434/'), 'http://localhost:11434')
  assert.equal(normalizeAiUrl('  192.168.0.20:11434 '), 'http://192.168.0.20:11434')
  assert.equal(normalizeAiUrl('https://ia.local'), 'https://ia.local')
  assert.equal(normalizeAiUrl('http://host:11434/ollama/'), 'http://host:11434/ollama')
  assert.equal(normalizeAiUrl(''), null)
  assert.equal(normalizeAiUrl('ftp://host'), null)
  assert.equal(normalizeAiUrl('http://'), null)
  assert.equal(normalizeAiUrl('não é endereço'), null)
})

test('documentos oficiais na IA', () => {
  assert.equal(referencesNotice(null).level, 'info')
  assert.equal(referencesNotice({ total: 0, ready: 0, failed: 0 }).title, 'No official documents downloaded yet')
  assert.equal(referencesNotice({ total: 7, ready: 3, failed: 0 }).titleParams?.ready, 3)
  assert.equal(referencesNotice({ total: 7, ready: 3, failed: 0 }).level, 'info')
  assert.equal(referencesNotice({ total: 7, ready: 6, failed: 1 }).level, 'warn')
  assert.equal(referencesNotice({ total: 7, ready: 7, failed: 0 }).level, 'ok')
})

test('modelos de um endereço testado', () => {
  assert.deepEqual(splitModels(['qwen3:8b', 'nomic-embed-text:v1.5']), { chat: ['qwen3:8b'], embedding: true })
  assert.deepEqual(splitModels(['qwen3:8b']), { chat: ['qwen3:8b'], embedding: false })
  assert.deepEqual(splitModels([]), { chat: [], embedding: false })
})
