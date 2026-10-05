import * as assert from 'node:assert/strict'
import { test } from 'node:test'

import { isManagedWikipediaFile } from '../../app/utils/managed_wikipedia.js'
import { findReplacedWikipediaFiles } from '../../app/utils/zim_filename.js'

test('reconhece a Wikipedia geral em inglês e em português', () => {
  for (const name of [
    'wikipedia_en_all_maxi_2026-02.zim',
    'wikipedia_en_top_mini_2026-06.zim',
    'wikipedia_pt_all_nopic_2026-05.zim',
    'wikipedia_pt_top_mini_2026-07.zim',
  ]) {
    assert.equal(isManagedWikipediaFile(name), true, name)
  }
})

test('aceita URL completa, com ou sem query string', () => {
  assert.equal(
    isManagedWikipediaFile(
      'https://download.kiwix.org/zim/wikipedia/wikipedia_pt_top_maxi_2026-07.zim'
    ),
    true
  )
  assert.equal(
    isManagedWikipediaFile('https://mirror.example/wikipedia_pt_all_mini_2026-05.zim?x=1'),
    true
  )
})

test('não confunde ZIMs temáticos de categoria com a Wikipedia geral', () => {
  for (const name of [
    'wikipedia_en_medicine_maxi_2026-01.zim',
    'wikipedia_pt_medicine_maxi_2026-07.zim',
    'wikipedia_pt_mathematics_maxi_2026-07.zim',
    'wikipedia_en_simple_all_nopic_2026-02.zim',
    'wikipedia_en_100_mini_2026-01.zim',
  ]) {
    assert.equal(isManagedWikipediaFile(name), false, name)
  }
})

test('ignora outros idiomas e outros projetos', () => {
  assert.equal(isManagedWikipediaFile('wikipedia_fr_all_maxi_2026-05.zim'), false)
  assert.equal(isManagedWikipediaFile('wikibooks_pt_all_maxi_2026-07.zim'), false)
})

test('findReplacedWikipediaFiles limpa versões antigas da Wikipedia em português', () => {
  assert.deepEqual(
    findReplacedWikipediaFiles('wikipedia_pt_all_nopic_2026-05.zim', [
      'wikipedia_pt_all_nopic_2026-02.zim',
      'wikipedia_pt_all_nopic_2026-05.zim',
      'wikipedia_pt_medicine_maxi_2026-07.zim',
      'wikipedia_en_all_nopic_2026-02.zim',
    ]),
    ['wikipedia_pt_all_nopic_2026-02.zim']
  )
})
