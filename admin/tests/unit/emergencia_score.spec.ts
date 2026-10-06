import * as assert from 'node:assert/strict'
import { test } from 'node:test'
import { corrigir, normalizar, type Pergunta } from '../eval/emergencia/score.js'

const pergunta: Pergunta = {
  id: 'queimadura',
  pergunta: 'Como tratar uma queimadura?',
  precisa: [{ descricao: 'resfriar com água', padroes: ['resfri|agua (corrente|limpa)'] }],
  naoPode: [{ descricao: 'gelo', padroes: ['\\bgelo\\b'] }],
  semSocorro: true,
  fonteOficial: true,
}

test('normaliza acento, maiúscula e markdown', () => {
  assert.equal(normalizar('**Não** use GELO'), ' nao use gelo')
})

test('proibição dita como proibição está certa', () => {
  const c = corrigir(pergunta, 'Resfrie com água corrente. Não use gelo.\n## Se não houver socorro\nCubra com pano limpo e úmido, troque o pano todo dia, dê bastante água para beber e observe se a pele fica vermelha, quente ou com pus, que são sinais de infecção.\n## Não faça', [
    { href: '/referencias/ms-cartilha#page=3' },
  ])
  assert.equal(c.acertos, c.total)
})

test('recomendar o que é proibido conta como erro', () => {
  const c = corrigir(pergunta, 'Coloque gelo na queimadura.', [])
  const gelo = c.verificacoes.find((v) => v.regra === 'não diz: gelo')
  assert.equal(gelo?.ok, false)
  assert.match(gelo?.trecho ?? '', /gelo/)
})

test('negação de outra frase não salva a recomendação errada', () => {
  const c = corrigir(pergunta, 'Não corra. Coloque gelo.', [])
  assert.equal(c.verificacoes.find((v) => v.regra === 'não diz: gelo')?.ok, false)
})

test('sem caminho sem socorro e sem documento oficial', () => {
  const c = corrigir(pergunta, 'Resfrie com água corrente e ligue 192.', [{ href: undefined }])
  assert.equal(c.verificacoes.find((v) => v.regra === 'caminho sem socorro')?.ok, false)
  assert.equal(c.verificacoes.find((v) => v.regra === 'cita documento oficial')?.ok, false)
})

test('"nada de" também é negação', () => {
  const c = corrigir(pergunta, 'Resfrie com água corrente (nada de gelo).', [])
  assert.equal(c.verificacoes.find((v) => v.regra === 'não diz: gelo')?.ok, true)
})

test('só o título, ou só "procure atendimento", não conta como caminho sem socorro', () => {
  const titulo = corrigir(pergunta, 'Resfrie com água.\n## Se não houver socorro\n## Não faça\nNão use gelo.', [])
  assert.equal(titulo.verificacoes.find((v) => v.regra === 'caminho sem socorro')?.ok, false)
  const soProcure = corrigir(pergunta, '## Se não houver socorro\nProcure atendimento médico o mais rápido possível.\n', [])
  assert.equal(soProcure.verificacoes.find((v) => v.regra === 'caminho sem socorro')?.ok, false)
})
