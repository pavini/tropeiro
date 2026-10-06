/**
 * The "Sources" list shown under an assistant answer (#1179).
 *
 * The rule these lock in is that a citation may only ever name a document the
 * model actually read. Offline there is no second opinion to check an answer
 * against, so a citation is the only provenance the user gets — and a wrong one
 * is worse than none, because it lends false weight to a fabricated answer.
 *
 * Pure functions only — no MySQL, Redis, Qdrant, or Ollama needed:
 *   npm run test:unit
 */
import * as assert from 'node:assert/strict'
import { test } from 'node:test'

import { buildCitations, buildContextBlock } from '../../app/utils/rag_prompt.js'

const chunk = (metadata: Record<string, any>) => ({ text: 'body', score: 0.5, metadata })

test('buildCitations collapses many chunks from one archive into a single entry', () => {
  const sources = buildCitations([
    chunk({ source: '/zim/survival.zim', archive_title: 'Survival Library' }),
    chunk({ source: '/zim/survival.zim', archive_title: 'Survival Library' }),
    chunk({ source: '/zim/survival.zim', archive_title: 'Survival Library' }),
  ])

  assert.equal(sources.length, 1)
  assert.equal(sources[0].title, 'Survival Library')
})

test('buildCitations dedupes on path, not title, so same-named archives stay distinct', () => {
  const sources = buildCitations([
    chunk({ source: '/zim/wikipedia_2024.zim', archive_title: 'Wikipedia' }),
    chunk({ source: '/zim/wikipedia_2026.zim', archive_title: 'Wikipedia' }),
  ])

  assert.equal(sources.length, 2)
  assert.deepEqual(
    sources.map((s) => s.source),
    ['/zim/wikipedia_2024.zim', '/zim/wikipedia_2026.zim']
  )
})

test('buildCitations prefers the archive title over per-article titles', () => {
  const [source] = buildCitations([
    chunk({
      source: '/zim/ifixit.zim',
      archive_title: 'iFixit Repair Guides',
      full_title: 'Replacing a MacBook battery',
      article_title: 'MacBook battery',
    }),
  ])

  assert.equal(source.title, 'iFixit Repair Guides')
})

test('buildCitations falls back through full_title then article_title', () => {
  assert.equal(
    buildCitations([chunk({ source: '/a.zim', full_title: 'Full', article_title: 'Article' })])[0]
      .title,
    'Full'
  )
  assert.equal(
    buildCitations([chunk({ source: '/b.zim', article_title: 'Article' })])[0].title,
    'Article'
  )
})

test('buildCitations names an untitled upload by its filename', () => {
  // A user-uploaded PDF carries no embedded metadata; the filename is what the
  // user chose and is the only label they will recognise.
  const [source] = buildCitations([chunk({ source: '/kb_uploads/well drilling notes.pdf' })])

  assert.equal(source.title, 'well drilling notes.pdf')
  assert.equal(source.source, '/kb_uploads/well drilling notes.pdf')
})

test('buildCitations carries the archive date when one is known', () => {
  const [withDate] = buildCitations([
    chunk({ source: '/zim/wiki.zim', archive_title: 'Wikipedia', archive_date: '2026-06' }),
  ])
  assert.equal(withDate.date, '2026-06')

  const [withoutDate] = buildCitations([chunk({ source: '/zim/wiki.zim', archive_title: 'Wikipedia' })])
  assert.equal(withoutDate.date, undefined)
})

test('buildCitations skips a chunk with neither a path nor a title', () => {
  // "Unknown source" is not a citation — it is a row the user cannot act on,
  // and it makes the answer look sourced when it is not.
  assert.deepEqual(buildCitations([chunk({ chunk_index: 3 })]), [])
})

test('buildCitations returns nothing when no context was injected', () => {
  // Retrieval skipped, or it declined because nothing cleared the relevance
  // floor. No context means no citations, not an empty-looking Sources header.
  assert.deepEqual(buildCitations([]), [])
})

test('buildCitations preserves injection order', () => {
  const sources = buildCitations([
    chunk({ source: '/zim/b.zim', archive_title: 'Second' }),
    chunk({ source: '/zim/a.zim', archive_title: 'First' }),
  ])

  assert.deepEqual(
    sources.map((s) => s.title),
    ['Second', 'First']
  )
})

test('documento oficial das fichas vem primeiro, com as páginas e o link para a primeira', () => {
  const samu = '/x/storage/referencias/ms-samu.pdf'
  const sources = buildCitations([
    chunk({ source: '/x/storage/zim/wikipedia_pt.zim', archive_title: 'Wikipédia' }),
    chunk({ source: samu, archive_title: 'Protocolos SAMU (Ministério da Saúde, 2016)', reference_id: 'ms-samu', page: 134 }),
    chunk({ source: samu, archive_title: 'Protocolos SAMU (Ministério da Saúde, 2016)', reference_id: 'ms-samu', page: 133 }),
  ])
  assert.deepEqual(sources[0], {
    title: 'Protocolos SAMU (Ministério da Saúde, 2016), p. 133, 134',
    href: '/referencias/ms-samu#page=133',
    pages: [133, 134],
  })
  assert.equal(sources[1].title, 'Wikipédia')
  assert.equal(sources.length, 2)
})

test('o trecho do documento oficial chega à IA com a página no rótulo', () => {
  const block = buildContextBlock([
    { text: 'Resfrie com água corrente.', metadata: { archive_title: 'Cartilha Queimaduras (Ministério da Saúde, 2012)', reference_id: 'q', page: 6 } },
  ])
  assert.equal(block, '[Context 1 — Cartilha Queimaduras (Ministério da Saúde, 2012), p. 6]\nResfrie com água corrente.')
})

test('protocolo profissional chega à IA marcado como tal', () => {
  const block = buildContextBlock([
    {
      text: 'Administrar oxigênio.',
      metadata: { archive_title: 'Protocolos SAMU (Ministério da Saúde, 2016)', reference_id: 'ms-samu-suporte-basico-de-vida-2016', page: 133 },
    },
  ])
  assert.match(block, /p\. 133 — protocolo para profissionais de saúde\]/)
})

test('a ficha do Tropeiro vem antes de tudo nas fontes, com link para ela', () => {
  const sources = buildCitations([
    chunk({ source: '/x/storage/referencias/ms-samu.pdf', archive_title: 'SAMU', reference_id: 'ms-samu', page: 133 }),
    chunk({ archive_title: 'Ficha de primeiros socorros do Tropeiro: Queimadura', ficha_slug: 'queimadura' }),
  ])
  assert.deepEqual(sources[0], { title: 'Ficha de primeiros socorros do Tropeiro: Queimadura', href: '/fichas/queimadura' })
  assert.equal(sources[1].href, '/referencias/ms-samu#page=133')
  assert.equal(sources.length, 2)
})

test('guia do Tropeiro usado na resposta aparece com link para ele', () => {
  const sources = buildCitations([
    chunk({ source: '/x/storage/guias/radio-uso-livre.md', archive_title: 'Guia do Tropeiro: Rádios sem licença', guide_slug: 'radio-uso-livre' }),
    chunk({ source: '/x/storage/guias/radio-uso-livre.md', archive_title: 'Guia do Tropeiro: Rádios sem licença', guide_slug: 'radio-uso-livre' }),
  ])
  assert.deepEqual(sources, [{ title: 'Guia do Tropeiro: Rádios sem licença', href: '/guias/radio-uso-livre' }])
})
