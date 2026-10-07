import * as assert from 'node:assert/strict'
import { test } from 'node:test'
import { CONTINUE_PROMPT, turnsFromMessages } from '../../inertia/novo/conversation.js'

const msg = (role: string, content: string, sources: string[] = []) => ({ role, content, sources })

test('mensagens guardadas viram perguntas com resposta e fontes', () => {
  const turns = turnsFromMessages([msg('user', 'Como tratar água?'), msg('assistant', 'Ferva por 1 minuto.', ['ficha'])])
  assert.deepEqual(turns, [{ question: 'Como tratar água?', answer: 'Ferva por 1 minuto.', sources: ['ficha'] }])
})

test('o pedido de continuar some e a continuação se junta à resposta', () => {
  const turns = turnsFromMessages([
    msg('user', 'Explique o rádio PX'),
    msg('assistant', 'O PX usa 27 MHz e', ['guia']),
    msg('user', CONTINUE_PROMPT),
    msg('assistant', ' precisa de cadastro.'),
    msg('user', 'Continue exactly where you left off. Do not repeat what you already wrote.'),
    msg('assistant', ' Fim.'),
  ])
  assert.equal(turns.length, 1)
  assert.equal(turns[0].answer, 'O PX usa 27 MHz e precisa de cadastro. Fim.')
  assert.deepEqual(turns[0].sources, ['guia'], 'a continuação sem fontes não apaga as da resposta')
})

test('pergunta sem resposta (a IA falhou) continua aparecendo', () => {
  const turns = turnsFromMessages([msg('user', 'Primeira'), msg('user', 'Segunda'), msg('assistant', 'Resposta')])
  assert.deepEqual(
    turns.map((t) => [t.question, t.answer]),
    [
      ['Primeira', ''],
      ['Segunda', 'Resposta'],
    ]
  )
})
