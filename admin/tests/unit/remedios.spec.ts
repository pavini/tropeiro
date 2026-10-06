import * as assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import {
  acaoParaInstalar,
  buscaDeRemedio,
  estadoDaBase,
  mencionados,
  simplesPrimeiro,
  situacoesQueCombinam,
} from '../../app/utils/remedios.js'

const ptBR: Record<string, string> = JSON.parse(readFileSync(new URL('../../inertia/i18n/locales/pt-BR.json', import.meta.url), 'utf8'))
const conditions = JSON.parse(readFileSync(new URL('../../../collections/conditions.json', import.meta.url), 'utf8')).conditions as {
  slug: string
  label: string
  category: string
}[]

test('nome usado no Brasil vira o das bulas americanas, sem ligar para acento e caixa', () => {
  assert.deepEqual(buscaDeRemedio('Paracetamol'), { termo: 'acetaminophen', traduzidoDe: 'Paracetamol', foraDosEua: null })
  assert.equal(buscaDeRemedio('ácido  acetilsalicílico').termo, 'aspirin')
  assert.equal(buscaDeRemedio('salbutamol').termo, 'albuterol')
})

test('nome igual nos dois países ou desconhecido segue como veio', () => {
  assert.deepEqual(buscaDeRemedio('captopril'), { termo: 'captopril', traduzidoDe: null, foraDosEua: null })
  assert.deepEqual(buscaDeRemedio(' Tylenol '), { termo: 'Tylenol', traduzidoDe: null, foraDosEua: null })
})

test('remédio que não existe nos EUA explica e sugere o parecido', () => {
  const r = buscaDeRemedio('Dipirona')
  assert.equal(r.foraDosEua?.parecido, 'paracetamol')
  assert.ok(ptBR[r.foraDosEua!.motivo], 'o motivo precisa de tradução')
})

test('situação encontrada pelo nome em português', () => {
  const traduzir = (s: string) => ptBR[s] ?? s
  const achadas = situacoesQueCombinam(conditions, 'dor de cabeca', traduzir).map((c) => c.slug)
  assert.deepEqual(achadas, ['headache'])
  assert.ok(situacoesQueCombinam(conditions, 'diarreia', traduzir).some((c) => c.slug === 'diarrhea'))
  assert.deepEqual(situacoesQueCombinam(conditions, 'do', traduzir), [], 'texto curto demais não filtra')
})

test('toda situação e categoria tem tradução', () => {
  const faltam = conditions.flatMap((c) => [c.label, c.category]).filter((k) => !ptBR[k])
  assert.deepEqual([...new Set(faltam)], [])
})

test('estado da base e o que o botão faz em cada um', () => {
  assert.equal(estadoDaBase('idle', 0), 'ausente')
  assert.equal(estadoDaBase('idle', 120), 'pronta')
  assert.equal(estadoDaBase('downloading', 0), 'baixando')
  assert.equal(estadoDaBase('ingesting', 10), 'organizando')
  assert.equal(acaoParaInstalar('ausente'), 'baixar')
  assert.equal(acaoParaInstalar(estadoDaBase('downloaded', 0)), 'organizar')
  assert.equal(acaoParaInstalar(estadoDaBase('failed', 0)), 'recomecar')
  assert.equal(acaoParaInstalar('baixando'), null)
  assert.equal(acaoParaInstalar('pronta'), null)
})

test('remédios com um só princípio ativo vêm primeiro, mantendo a ordem entre iguais', () => {
  const lista = [
    { id: 1, generic_name: 'ACETAMINOPHEN, CAFFEINE' },
    { id: 2, generic_name: 'IBUPROFEN' },
    { id: 3, generic_name: null },
    { id: 4, generic_name: 'NAPROXEN' },
  ]
  assert.deepEqual(simplesPrimeiro(lista).map((d) => d.id), [2, 3, 4, 1])
})

test('aponta quando a bula de um cita o princípio ativo do outro', () => {
  const varfarina = { id: 1, generic_name: 'WARFARIN SODIUM', drug_interactions: 'Aspirin and NSAIDs increase bleeding risk.' }
  const aspirina = { id: 2, generic_name: 'ASPIRIN', drug_interactions: 'Ask a doctor if you take warfarin.' }
  const ibuprofeno = { id: 3, generic_name: 'IBUPROFEN', drug_interactions: null }
  const todos = [varfarina, aspirina, ibuprofeno]
  assert.deepEqual(mencionados(varfarina, todos).map((d) => d.id), [2])
  assert.deepEqual(mencionados(aspirina, todos).map((d) => d.id), [1], 'warfarin sodium é citado como warfarin')
  assert.deepEqual(mencionados(ibuprofeno, todos), [])
})
