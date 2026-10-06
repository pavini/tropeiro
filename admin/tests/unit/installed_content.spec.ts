import * as assert from 'node:assert/strict'
import { test } from 'node:test'
import { bookTitle, isWikipediaFile, mapTitle } from '../../app/utils/installed_content.js'

test('título do livro vem do Kiwix quando existe', () => {
  assert.equal(bookTitle('wikipedia_pt_all_nopic_2026-05.zim', 'Wikipédia'), 'Wikipédia')
})

test('sem título do Kiwix, usa o nome do arquivo sem a data', () => {
  assert.equal(bookTitle('nhs.uk_en_medicines_2025-12.zim'), 'Nhs.uk en medicines')
  assert.equal(bookTitle('ifixit_pt_all_2026-03.zim', '  '), 'Ifixit pt all')
})

test('reconhece a Wikipedia gerenciada', () => {
  assert.ok(isWikipediaFile('wikipedia_pt_top_mini_2026-07.zim'))
  assert.ok(!isWikipediaFile('wikivoyage_pt_all_maxi_2026-09.zim'))
})

test('mapa de país recortado vira o nome do país', () => {
  assert.equal(mapTitle('br_20261006_z15.pmtiles'), 'Brasil')
  assert.equal(mapTitle('br-ar_20261006_z15.pmtiles'), 'Brasil, Argentina')
})

test('mapa de coleção usa o id legível', () => {
  assert.equal(mapTitle('us-pacific_2025-12.pmtiles'), 'Us pacific')
})
