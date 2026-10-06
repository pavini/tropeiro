import * as assert from 'node:assert/strict'
import { test } from 'node:test'
import { parseSnippet } from '../../app/utils/kiwix_snippet.js'

test('separa o termo destacado do resto do texto', () => {
  assert.deepEqual(parseSnippet('...a <b>queimadura</b> grave...'), [
    { text: '…a ', bold: false },
    { text: 'queimadura', bold: true },
    { text: ' grave…', bold: false },
  ])
})

test('decodifica entidades HTML', () => {
  assert.deepEqual(parseSnippet('água &amp; sabão &quot;neutro&quot; &#233;'), [
    { text: 'água & sabão "neutro" é', bold: false },
  ])
})

test('descarta outras tags em vez de repassar HTML', () => {
  const parts = parseSnippet('<script>alert(1)</script>texto <i>itálico</i> <b>termo</b>')
  assert.ok(parts.every((p) => !p.text.includes('<')))
  assert.deepEqual(
    parts.map((p) => p.text).join(''),
    'alert(1)texto itálico termo'
  )
})

test('texto vazio ou ausente vira lista vazia', () => {
  assert.deepEqual(parseSnippet(''), [])
  assert.deepEqual(parseSnippet(undefined as unknown as string), [])
})
