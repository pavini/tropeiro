import * as assert from 'node:assert/strict'
import { test } from 'node:test'
import { guideToMarkdown } from '../../app/utils/guide_text.js'
import type { Guide } from '../../types/guias.js'

const guide: Guide = {
  slug: 'teste',
  track: 'radio',
  order: 1,
  title: 'Rádios sem licença',
  summary: 'O que dá para usar sem licença.',
  keywords: ['radio'],
  sections: [
    {
      title: 'Canais',
      blocks: [
        { kind: 'text', text: 'São sete canais.' },
        { kind: 'table', caption: 'Canais de uso geral', columns: ['Canal', 'Frequência (MHz)'], rows: [['1', '462,5625']], note: 'potência até 0,5 W' },
        { kind: 'list', ordered: true, items: ['Ligue o rádio', 'Escolha o canal'] },
        { kind: 'note', text: 'Emergência tem prioridade.' },
      ],
    },
  ],
  refs: [{ doc: 'anatel', page: 3, about: 'canais' }],
  reviewed: false,
}

test('guia vira texto para a IA, com tabela em linhas e fontes', () => {
  assert.equal(
    guideToMarkdown(guide, [{ id: 'anatel', title: 'Resolução 1', publisher: 'Anatel', year: 2025 }]),
    [
      '# Guia do Tropeiro: Rádios sem licença',
      'O que dá para usar sem licença.',
      '## Canais',
      'São sete canais.',
      'Canais de uso geral:\n- Canal: 1; Frequência (MHz): 462,5625\n(potência até 0,5 W)',
      '1. Ligue o rádio\n2. Escolha o canal',
      'Atenção: Emergência tem prioridade.',
      'Fontes: Resolução 1 (Anatel, 2025).',
    ].join('\n\n') + '\n'
  )
})
