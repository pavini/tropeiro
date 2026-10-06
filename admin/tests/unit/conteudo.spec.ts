import * as assert from 'node:assert/strict'
import { test } from 'node:test'
import { contentPlainText, parseContent, parseSourceText, tableProblems, toFicha } from '../../app/utils/conteudo.js'

const guia = `---
titulo: Rádios sem licença
tema: radio
tipo: guia
resumo: O que dá para usar sem licença.
palavras-chave: [walkie-talkie, PX]
veja-tambem: [radio/como-o-radio-funciona]
revisao:
  revisado: false
autores: [André Pavini]
atualizado: 2026-10-06
---

## Rádio de uso geral

Potência máxima de 0,5 W.[^potencia]

| Canal | Frequência (MHz) |
|-------|------------------|
| 1     | 462,5625         |

> [!ATENCAO]
> Emergência tem prioridade.

[^potencia]: anatel-ato-14448-2017, trecho "15.1.3. A potência" — potência máxima
`

test('lê o cabeçalho, o texto e as notas de fonte', () => {
  const { item, problems } = parseContent(guia, 'radio/radios-sem-licenca.md')
  assert.deepEqual(problems, [])
  assert.equal(item!.id, 'radio/radios-sem-licenca')
  assert.equal(item!.type, 'guia')
  assert.deepEqual(item!.seeAlso, ['radio/como-o-radio-funciona'])
  assert.equal(item!.updated, '2026-10-06')
  assert.deepEqual(item!.refs, [
    { doc: 'anatel-ato-14448-2017', anchor: '15.1.3. A potência', about: 'potência máxima', note: 'potencia' },
  ])
  // a definição da nota sai do texto; a marca no texto fica, para virar link
  assert.doesNotMatch(item!.body, /\[\^potencia\]:/)
  assert.match(item!.body, /0,5 W\.\[\^potencia\]/)
})

test('fonte em texto: página ou trecho', () => {
  assert.deepEqual(parseSourceText('ms-cartilha-queimaduras-2012, p. 6 — resfriar'), {
    doc: 'ms-cartilha-queimaduras-2012',
    page: 6,
    about: 'resfriar',
  })
  assert.equal(parseSourceText('sem formato'), null)
})

test('problemas em português, com o que corrigir', () => {
  const ruim = guia
    .replace('tema: radio', 'tema: saude')
    .replace('palavras-chave: [walkie-talkie, PX]', 'palavras-chave: []')
    .replace('0,5 W.[^potencia]', '0,5 W.[^outra]')
  const { item, problems } = parseContent(ruim, 'radio/radios-sem-licenca.md')
  assert.equal(item, null)
  const msgs = problems.map((p) => p.message).join(' | ')
  assert.match(msgs, /não bate com a pasta "radio"/)
  assert.match(msgs, /palavras-chave/)
  assert.match(msgs, /\[\^outra\] é usada no texto mas não está definida/)
  assert.match(msgs, /\[\^potencia\] está definida mas não é usada/)
})

test('sem cabeçalho ou sem fonte não passa', () => {
  assert.match(parseContent('# Título', 'radio/x.md').problems[0].message, /falta o cabeçalho/)
  const semFonte = guia.replace('0,5 W.[^potencia]', '0,5 W.').replace(/\[\^potencia\]:.*\n/, '')
  assert.match(parseContent(semFonte, 'radio/x.md').problems.map((p) => p.message).join(), /pelo menos uma fonte/)
})

const ficha = `---
titulo: Queimadura
tema: saude
tipo: ficha
resumo: Resfrie com água.
palavras-chave: [queimadura]
ligue-antes: Se for grande, ligue 192.
revisao: { revisado: false }
autores: [André Pavini]
atualizado: 2026-10-06
fontes:
  - { doc: ms-cartilha-queimaduras-2012, pagina: 6, sobre: resfriar }
---

## Faça

1. Resfrie com água limpa.[^agua]

## Não faça

- Não use gelo.

## Procure ajuda — Queimadura grave

- Área grande do corpo.

[^agua]: ms-cartilha-queimaduras-2012, p. 6 — resfriar com água
`

test('ficha: seções pelos títulos fixos, itens sem as marcas de nota', () => {
  const { item } = parseContent(ficha, 'saude/queimadura.md')
  const { ficha: f, problems } = toFicha(item!)
  assert.deepEqual(problems, [])
  assert.equal(f!.callFirst, 'Se for grande, ligue 192.')
  assert.deepEqual(
    f!.sections.map((s) => [s.kind, s.title ?? '', s.items]),
    [
      ['do', '', ['Resfrie com água limpa.']],
      ['dont', '', ['Não use gelo.']],
      ['help', 'Queimadura grave', ['Área grande do corpo.']],
    ]
  )
  assert.equal(f!.refs.length, 2)
})

test('tabela com linha de tamanho diferente é apontada', () => {
  const { item } = parseContent(guia.replace('| 1     | 462,5625         |', '| 1 | 462,5625 | extra |'), 'radio/x.md')
  assert.match(tableProblems(item!)[0].message, /3 colunas, mas o cabeçalho tem 2/)
})

test('texto para a IA: tabela em linhas, aviso e fontes', () => {
  const { item } = parseContent(guia, 'radio/radios-sem-licenca.md')
  const text = contentPlainText(item!, (id) => (id === 'anatel-ato-14448-2017' ? 'Ato 14.448/2017 (Anatel)' : undefined))
  assert.match(text, /^# Rádios sem licença\n/)
  assert.match(text, /- Canal: 1; Frequência \(MHz\): 462,5625/)
  assert.match(text, /Atenção:\nEmergência tem prioridade\./)
  assert.match(text, /Potência máxima de 0,5 W\.\n/)
  assert.match(text, /Fontes: Ato 14\.448\/2017 \(Anatel\)\./)
})

test('os modelos de conteudo/modelos estão no formato certo', async () => {
  const { readFileSync } = await import('node:fs')
  const { join } = await import('node:path')
  const { contentDir } = await import('../../app/content/loader.js')
  for (const [file, tema] of [['ficha.md', 'saude'], ['guia.md', 'radio'], ['referencia.md', 'radio']]) {
    const text = readFileSync(join(contentDir(), 'modelos', file), 'utf-8')
    const { problems } = parseContent(text, `${tema}/modelo.md`)
    assert.deepEqual(problems, [], `${file}: ${problems.map((p) => p.message).join('; ')}`)
  }
})
