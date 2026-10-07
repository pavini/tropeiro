import * as assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { test } from 'node:test'
import {
  chavesDoNome,
  monografiaParaIa,
  monografiasCitadas,
  monografiasDoFtn,
  monografiasPorNome,
  nomeDoCabecalho,
} from '../../app/utils/ftn.js'
import { APELIDOS_NO_FTN } from '../../constants/remedios.js'

// Páginas no formato que a leitura do PDF devolve: nome com maiúsculas
// embaralhadas (versalete), autor normal, rodapés e palavras partidas.
const PAGINAS = [
  { num: 13, text: 'instruções de uso\nAZATioPriNA\nMaurício Fábio Gomes\nNa Rename 2010: Item 7.1\nexemplo' },
  {
    num: 897,
    text: [
      'Aspectos farmacêuticos 4',
      '• Manter em local seco.',
      'PANTOPrAzoL (ver omEPrAzoL)',
      'PArACETAmoL',
      'Maria Isabel Fischer',
      'Na rename 2010: itens 2.1 e 2.3',
      'Apresentações',
      '• Comprimido 500 mg',
      'indicações 1-4, 8, 17',
      '• Dor leve a moderada.',
      'Secretaria de Ciência, Tecnologia e Insumos Estratégicos/MS - FTN',
      '897',
    ].join('\n'),
  },
  {
    num: 898,
    text: [
      '898',
      'Monografias dos produtos em ordem alfabética',
      'Esquema de administração 1-4, 17',
      '• 10 a 15 mg/kg, por via oral, a cada 4 a 6 horas (máximo de 5 doses em 24',
      'horas).',
      'Aspectos farmacocinéticos 3, 4',
      '• Meia-vida: 1 a 4 horas.',
      'interações de medicamentos 3, 5',
      '• Varfarina: pode aumentar o risco de sangra-',
      'mento.',
      'ACETATo DE DExAmETASoNA (ver DExAmETASoNA E',
      'ACETATo DE DExAmETASoNA)',
      'SuLFATo DE SALBuTAmoL',
      'Letícia Figueira Freitas',
      'Marcela de Andrade Conti',
      'Na rename 2010: item 12',
      'indicações',
      '• Crise de asma.',
    ].join('\n'),
  },
]

test('acha as monografias e pula o exemplo das instruções de uso', () => {
  const ms = monografiasDoFtn(PAGINAS)
  assert.deepEqual(
    ms.map((m) => [m.nome, m.pagina, m.paginaFim]),
    [
      ['paracetamol', 897, 898],
      ['sulfato de salbutamol', 898, 898],
    ]
  )
  const paracetamol = ms[0]
  assert.ok(!paracetamol.texto.includes('Secretaria de Ciência'), 'sem rodapé')
  assert.ok(paracetamol.texto.includes('risco de sangramento'), 'palavra partida no fim da linha volta a ser uma')
  assert.ok(!paracetamol.texto.includes('DExAmETASoNA'), 'a remissão seguinte não entra no texto')
})

test('para a IA ficam as seções úteis, sem farmacocinética', () => {
  const [paracetamol] = monografiasDoFtn(PAGINAS)
  const texto = monografiaParaIa(paracetamol)
  assert.match(texto, /^PARACETAMOL/)
  assert.match(texto, /Esquema de administração:\n• 10 a 15 mg\/kg/)
  assert.match(texto, /interações de medicamentos:/)
  assert.ok(!texto.includes('Meia-vida'))
  assert.ok(!texto.includes('▸'), 'sem faixa de idade no exemplo')
  const longa = { ...paracetamol, texto: `paracetamol\nindicações\n${'• Dor.\n'.repeat(200)}Esquema de administração\n• 500 mg.` }
  const curta = monografiaParaIa(longa)
  assert.match(curta, /\[…\]\n\nEsquema de administração:\n• 500 mg\./, 'indicação longa não empurra a dose para fora')
})

test('nome sem o sal e variantes', () => {
  assert.deepEqual(chavesDoNome('dipirona sódica'), ['dipirona sodica', 'dipirona'])
  assert.ok(chavesDoNome('cloridrato de epinefrina ou hemitartarato de epinefrina').includes('epinefrina'))
  assert.ok(chavesDoNome('omeprazol e omeprazol sódico').includes('omeprazol'))
  assert.deepEqual(chavesDoNome('carbonato de cálcio'), ['carbonato de calcio'], 'mineral sozinho não vira chave')
  assert.deepEqual(chavesDoNome('amoxicilina + clavulanato de potássio'), ['amoxicilina + clavulanato de potassio'])
})

test('limpa remissões e notas do cabeçalho', () => {
  assert.equal(nomeDoCabecalho('MorFiNA (ver SuLFATo DE morFiNA) muCiLoiDE DE psyllium'), 'muciloide de psyllium')
  assert.equal(nomeDoCabecalho('LEVoNorGESTrEL (VEr TAmBém ETiNiLESTrADioL + LEVoNorGESTrEL)'), 'levonorgestrel')
  assert.equal(nomeDoCabecalho('de SÓDio) mELFALANA'), 'melfalana')
  assert.equal(nomeDoCabecalho('FATor Viii (VoN WiLLEBrAND)'), 'fator viii (von willebrand)')
})

const m = (nome: string) => ({ nome, chaves: chavesDoNome(nome), pagina: 1, paginaFim: 1, texto: nome })
const LISTA = [
  m('paracetamol'),
  m('dipirona sódica'),
  m('amoxicilina'),
  m('amoxicilina + clavulanato de potássio'),
  m('ácido acetilsalicílico'),
  m('sais para reidratação oral'),
]

test('acha na pergunta os remédios citados, um por remédio', () => {
  const nomes = (q: string) => monografiasCitadas(q, LISTA).map((x) => x.nome)
  assert.deepEqual(nomes('Posso tomar Dipirona junto com paracetamol?'), ['paracetamol', 'dipirona sódica'])
  assert.deepEqual(nomes('amoxicilina para criança de 3 anos'), ['amoxicilina'])
  assert.deepEqual(nomes('tomei AAS'), ['ácido acetilsalicílico'], 'apelido')
  assert.deepEqual(nomes('como fazer soro caseiro'), ['sais para reidratação oral'])
  assert.deepEqual(nomes('dor nas costas'), [])
})

test('busca pelo começo do nome, na tela', () => {
  assert.deepEqual(
    monografiasPorNome('amox', LISTA).map((x) => x.nome),
    ['amoxicilina', 'amoxicilina + clavulanato de potássio']
  )
  assert.deepEqual(monografiasPorNome('am', LISTA), [], 'curto demais')
})

// Com o PDF oficial baixado (storage/referencias), confere o livro inteiro.
const PDF = new URL('../../storage/referencias/ms-formulario-terapeutico-nacional-2010.pdf', import.meta.url)
test('FTN de verdade: monografias, páginas e apelidos', { skip: !existsSync(PDF) && 'FTN não baixado' }, async () => {
  const { PDFParse } = await import('pdf-parse')
  const parser = new PDFParse({ data: readFileSync(PDF) })
  const { pages } = await parser.getText()
  await parser.destroy()
  const ms = monografiasDoFtn(pages)
  assert.ok(ms.length >= 345, `${ms.length} monografias`)
  const pagina = (q: string) => monografiasCitadas(q, ms, 1)[0]?.pagina
  assert.equal(pagina('paracetamol'), 898)
  assert.equal(pagina('dipirona'), 646)
  assert.equal(pagina('varfarina'), 1051)
  const semMonografia = Object.keys(APELIDOS_NO_FTN).filter((a) => monografiasCitadas(a, ms, 1).length === 0)
  assert.deepEqual(semMonografia, [])
  assert.ok(ms.every((x) => !/\(ver |^[^(]*\)/.test(x.nome)), 'nenhuma remissão no nome')
})

test('faixas de idade em destaque no texto para a IA', () => {
  const m = {
    nome: 'paracetamol',
    chaves: ['paracetamol'],
    pagina: 1,
    paginaFim: 1,
    texto: 'paracetamol\nEsquema de administração\nCrianças até 12 anos\n• 10 a 15 mg/kg.\nAdultos e crianças com mais de 12 anos\n• 500 mg. Dose máxima diária: 4.000 mg.',
  }
  const texto = monografiaParaIa(m)
  assert.match(texto, /▸ CRIANÇAS ATÉ 12 ANOS\n• 10 a 15 mg\/kg\.\n▸ ADULTOS E CRIANÇAS COM MAIS DE 12 ANOS/)
})
