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

test('reconhece trecho de caixa de navegação e não confunde com texto corrido', async () => {
  const { looksLikeNavigation } = await import('../../app/utils/kiwix_snippet.js')
  const nav = parseSnippet(
    '...Choque circulatório Choque anafilático Choque cardiogênico Choque séptico Intoxicação Água Alcóolica Antidepressivos Cianeto Cocaína <b>Queimadura</b> Mercúrio Opioides...'
  )
  const prose = parseSnippet(
    '...A maior parte das <b>queimaduras</b> é causada por calor, líquidos quentes ou fogo. O tratamento depende da gravidade, e as superficiais podem ser tratadas em casa com analgésicos...'
  )
  assert.equal(looksLikeNavigation(nav), true)
  assert.equal(looksLikeNavigation(prose), false)
})

test('monta trecho com os termos destacados, sem acento e pelo começo da palavra', async () => {
  const { highlightSnippet } = await import('../../app/utils/kiwix_snippet.js')
  const parts = highlightSnippet('Queimadura é uma lesão na pele causada por calor.', 'queimadura na pele')
  assert.deepEqual(
    parts.filter((p) => p.bold).map((p) => p.text.trim()),
    ['Queimadura', 'pele']
  )
  assert.equal(parts.map((p) => p.text).join(''), 'Queimadura é uma lesão na pele causada por calor.')
})

test('corta texto longo numa palavra inteira', async () => {
  const { highlightSnippet } = await import('../../app/utils/kiwix_snippet.js')
  const text = highlightSnippet('palavra '.repeat(80), 'xyz', 50).map((p) => p.text).join('')
  assert.ok(text.length <= 52 && text.endsWith('…'))
  assert.ok(!text.includes('palav…'))
})
