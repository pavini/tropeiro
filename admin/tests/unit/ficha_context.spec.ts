import * as assert from 'node:assert/strict'
import { test } from 'node:test'
import { fichaContextText, fichaContextTitle } from '../../app/utils/ficha_context.js'
import type { Ficha } from '../../types/fichas.js'

const ficha: Ficha = {
  slug: 'queimadura',
  title: 'Queimadura',
  summary: 'Resfrie com água.',
  keywords: ['queimadura'],
  callFirst: 'Se for grande, ligue 192.',
  sections: [
    { kind: 'do', items: ['Resfrie a área com água limpa.'] },
    { kind: 'dont', items: ['Não use gelo.'] },
    { kind: 'help', title: 'Queimadura grave', items: ['A queimadura pega uma área grande.'] },
  ],
  refs: [
    { doc: 'cartilha', page: 6, about: 'resfriar' },
    { doc: 'cartilha', page: 7, about: 'gelo' },
  ],
  reviewed: false,
}

test('ficha vira texto com faça, não faça, quando pedir ajuda e fontes', () => {
  const text = fichaContextText(ficha, [{ id: 'cartilha', title: 'Cartilha', publisher: 'Ministério da Saúde', year: 2012 }])
  assert.equal(
    text,
    [
      'Queimadura',
      'Antes de tudo: Se for grande, ligue 192.',
      '',
      'Faça:',
      '- Resfrie a área com água limpa.',
      '',
      'Não faça:',
      '- Não use gelo.',
      '',
      'Procure atendimento ou peça ajuda quando — Queimadura grave:',
      '- A queimadura pega uma área grande.',
      '',
      'Baseada em: Cartilha (Ministério da Saúde, 2012).',
    ].join('\n')
  )
})

test('título do trecho', () => {
  assert.equal(fichaContextTitle(ficha), 'Ficha de primeiros socorros do Tropeiro: Queimadura')
})
