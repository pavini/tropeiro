import * as assert from 'node:assert/strict'
import { test } from 'node:test'
import { pickWikipediaFromDisk } from '../../app/utils/wikipedia_from_disk.js'

const base = 'https://download.kiwix.org/zim/wikipedia'
const options = [
  { id: 'none', url: null, size_mb: 0 },
  { id: 'pt-top-mini', url: `${base}/wikipedia_pt_top_mini_2026-07.zim`, size_mb: 153 },
  { id: 'pt-all-nopic', url: `${base}/wikipedia_pt_all_nopic_2026-05.zim`, size_mb: 6745 },
  { id: 'top-mini', url: `${base}/wikipedia_en_top_mini_2026-07.zim`, size_mb: 153 },
]

test('acha a opção cujo arquivo está no disco', () => {
  assert.equal(pickWikipediaFromDisk(options, ['wikipedia_pt_top_mini_2026-07.zim', 'outro.zim'])?.id, 'pt-top-mini')
})

test('com mais de uma no disco, fica a maior', () => {
  const files = ['wikipedia_pt_top_mini_2026-07.zim', 'wikipedia_pt_all_nopic_2026-05.zim']
  assert.equal(pickWikipediaFromDisk(options, files)?.id, 'pt-all-nopic')
})

test('em empate de tamanho, prefere a em português', () => {
  const files = ['wikipedia_en_top_mini_2026-07.zim', 'wikipedia_pt_top_mini_2026-07.zim']
  assert.equal(pickWikipediaFromDisk(options, files)?.id, 'pt-top-mini')
})

test('versão diferente da do catálogo não conta', () => {
  assert.equal(pickWikipediaFromDisk(options, ['wikipedia_pt_top_mini_2025-01.zim']), null)
})

test('nada no disco, nada escolhido', () => {
  assert.equal(pickWikipediaFromDisk(options, []), null)
})
