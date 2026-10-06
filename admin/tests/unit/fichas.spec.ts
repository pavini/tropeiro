import * as assert from 'node:assert/strict'
import { test } from 'node:test'
import { FICHAS } from '../../app/content/fichas.js'
import { REFERENCE_DOCS } from '../../app/content/referencias.js'
import { searchFichas, normalizeText } from '../../app/utils/fichas_search.js'

test('documentos de referência têm id único, endereço oficial https e sha256', () => {
  const ids = REFERENCE_DOCS.map((d) => d.id)
  assert.equal(new Set(ids).size, ids.length)
  for (const doc of REFERENCE_DOCS) {
    assert.match(doc.url, /^https:\/\/[^/]+\.gov\.br\//, `${doc.id}: fonte deve ser oficial (gov.br)`)
    assert.match(doc.sha256, /^[0-9a-f]{64}$/, `${doc.id}: sha256 inválido`)
    assert.ok(doc.sizeBytes > 0)
    assert.ok(doc.license.trim(), `${doc.id}: sem nota de licença`)
  }
})

test('fichas têm slug único, o que fazer e fontes que existem', () => {
  const slugs = FICHAS.map((f) => f.slug)
  assert.equal(new Set(slugs).size, slugs.length)
  for (const ficha of FICHAS) {
    assert.match(ficha.slug, /^[a-z0-9-]+$/)
    assert.ok(ficha.sections.some((s) => s.kind === 'do'), `${ficha.slug}: sem seção "faça"`)
    assert.ok(ficha.sections.every((s) => s.items.length > 0), `${ficha.slug}: seção vazia`)
    assert.ok(ficha.keywords.length > 0, `${ficha.slug}: sem palavras-chave`)
    assert.ok(ficha.refs.length > 0, `${ficha.slug}: sem fonte`)
    for (const ref of ficha.refs) {
      assert.ok(REFERENCE_DOCS.some((d) => d.id === ref.doc), `${ficha.slug}: documento ${ref.doc} não existe`)
      assert.ok(Number.isInteger(ref.page) && ref.page > 0, `${ficha.slug}: página inválida`)
    }
  }
})

test('normaliza acento e caixa', () => {
  assert.equal(normalizeText('  Água FERVENTE '), 'agua fervente')
})

test('busca acha a ficha certa, com ou sem acento e com palavra incompleta', () => {
  const first = (q: string) => searchFichas(FICHAS, q)[0]?.slug
  assert.equal(first('queimadura'), 'queimadura')
  assert.equal(first('queim'), 'queimadura')
  assert.equal(first('agua fervente'), 'queimadura')
  assert.equal(first('engasgado'), 'engasgo')
  assert.equal(first('massagem cardiaca'), 'parada-cardiaca')
  assert.equal(first('corte na mão'), 'sangramento')
  assert.equal(first('desmaiou'), 'desmaio')
  assert.equal(first('levou um tiro'), 'ferimento-a-tiro')
  assert.equal(first('baleado'), 'ferimento-a-tiro')
  assert.equal(first('convulsao'), 'convulsao')
  assert.equal(first('choque eletrico'), 'choque-eletrico')
  assert.equal(first('osso quebrado'), 'fratura')
  assert.equal(first('afogado'), 'afogamento')
  assert.equal(first('cobra picou'), 'picada-de-animal-peconhento')
  assert.equal(first('escorpiao'), 'picada-de-animal-peconhento')
  assert.equal(first('soro caseiro'), 'diarreia-e-desidratacao')
  assert.equal(first('febre em bebe'), 'crianca-sinais-de-perigo')
  assert.equal(first('enchente'), 'enchente')
  assert.equal(first('agua sanitaria'), 'agua-para-beber')
  assert.ok(
    searchFichas(FICHAS, 'como deixar a água da enchente boa para beber?').some((f) => f.slug === 'agua-para-beber'),
    'água para beber deve vir entre as sugestões'
  )
  assert.deepEqual(
    searchFichas(FICHAS, 'como tratar água da enchente').map((f) => f.slug).slice(0, 2).sort(),
    ['agua-para-beber', 'enchente']
  )
})

test('busca sem relação ou curta demais não traz ficha', () => {
  assert.deepEqual(searchFichas(FICHAS, 'xilofone'), [])
  assert.deepEqual(searchFichas(FICHAS, 'ab'), [])
})
