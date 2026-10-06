import * as assert from 'node:assert/strict'
import { test } from 'node:test'
import { parseSseChunk } from '../../inertia/novo/sse.js'

test('lê eventos completos e guarda o resto incompleto', () => {
  const { events, rest } = parseSseChunk('data: {"a":1}\n\ndata: {"b":2}\n\ndata: {"c"')
  assert.deepEqual(events, [{ a: 1 }, { b: 2 }])
  assert.equal(rest, 'data: {"c"')
})

test('um evento partido em dois pedaços é lido quando completa', () => {
  const first = parseSseChunk('data: {"message":{"con')
  assert.deepEqual(first.events, [])
  const second = parseSseChunk(first.rest + 'tent":"oi"}}\n\n')
  assert.deepEqual(second.events, [{ message: { content: 'oi' } }])
  assert.equal(second.rest, '')
})

test('ignora linhas que não são data e eventos quebrados', () => {
  const { events } = parseSseChunk(': comentário\n\ndata: não é json\n\ndata: {"ok":true}\n\n')
  assert.deepEqual(events, [{ ok: true }])
})
