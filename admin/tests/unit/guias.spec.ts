import * as assert from 'node:assert/strict'
import { test } from 'node:test'
import { GUIDES, GUIDE_TRACKS } from '../../app/content/guias/index.js'
import { REFERENCE_DOCS } from '../../app/content/referencias.js'
import { searchFichas } from '../../app/utils/fichas_search.js'

test('guias têm slug único, trilha que existe e ordem sem repetir', () => {
  const slugs = GUIDES.map((g) => g.slug)
  assert.equal(new Set(slugs).size, slugs.length)
  for (const g of GUIDES) {
    assert.match(g.slug, /^[a-z0-9-]+$/)
    assert.ok(GUIDE_TRACKS.some((t) => t.id === g.track), `${g.slug}: trilha ${g.track} não existe`)
    assert.ok(g.keywords.length > 0, `${g.slug}: sem palavras-chave`)
  }
  for (const track of GUIDE_TRACKS) {
    const orders = GUIDES.filter((g) => g.track === track.id).map((g) => g.order)
    assert.equal(new Set(orders).size, orders.length, `${track.id}: ordem repetida`)
  }
})

test('toda fonte existe e aponta o lugar: página no PDF, trecho na norma em HTML', () => {
  for (const g of GUIDES) {
    assert.ok(g.refs.length > 0, `${g.slug}: sem fonte`)
    for (const ref of g.refs) {
      const doc = REFERENCE_DOCS.find((d) => d.id === ref.doc)
      assert.ok(doc, `${g.slug}: documento ${ref.doc} não existe`)
      if (doc!.format === 'html') assert.ok(ref.anchor?.trim(), `${g.slug}: ${ref.doc} precisa de trecho`)
      else assert.ok(Number.isInteger(ref.page) && ref.page! > 0, `${g.slug}: ${ref.doc} precisa de página`)
    }
  }
})

test('tabelas com o mesmo número de colunas em todas as linhas', () => {
  for (const g of GUIDES) {
    for (const section of g.sections) {
      assert.ok(section.blocks.length > 0, `${g.slug}: seção "${section.title}" vazia`)
      for (const b of section.blocks) {
        if (b.kind !== 'table') continue
        for (const row of b.rows) assert.equal(row.length, b.columns.length, `${g.slug}: linha ${row.join('|')}`)
      }
    }
  }
})

test('busca acha a aula de rádio pelo nome popular', () => {
  assert.equal(searchFichas(GUIDES, 'walkie talkie')[0]?.slug, 'radio-sem-licenca')
  assert.equal(searchFichas(GUIDES, 'faixa do cidadão')[0]?.slug, 'radio-sem-licenca')
  assert.equal(searchFichas(GUIDES, 'repetidora')[0]?.slug, 'radio-como-funciona')
})
