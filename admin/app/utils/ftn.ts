import { semAcento } from './remedios.js'
import { APELIDOS_NO_FTN } from '../../constants/remedios.js'

/**
 * Formulário Terapêutico Nacional (FTN 2010): o resumo oficial, em português,
 * de cada medicamento da Rename. Aqui o PDF vira um índice de monografias
 * (nome, páginas e texto), para a tela de Remédios abrir a página certa e a
 * IA ler a monografia do remédio citado na pergunta.
 */

export const FTN_ID = 'ms-formulario-terapeutico-nacional-2010'

/** Muda quando a leitura do PDF muda, para o índice guardado ser montado de novo. */
export const FTN_INDICE_VERSAO = 2

export interface Monografia {
  /** Nome como aparece no FTN, em minúsculas ("dipirona sódica"). */
  nome: string
  /** Formas de achar a monografia numa pergunta, sem acento ("dipirona sodica", "dipirona"). */
  chaves: string[]
  pagina: number
  paginaFim: number
  texto: string
}

const MARCA = /^\s*na rename 2010\s*:/i
const RODAPE = [/^secretaria de ci[eê]ncia, tecnologia e insumos estrat[eé]gicos\/ms - ftn$/i, /^\d{1,4}$/, /^monografias dos produtos em ordem alfab[eé]tica$/i]
// Título de apêndice ("Apêndice D – Fármacos e Nefropatias"), não a remissão "(ver Apêndice D)."
const FIM_DAS_MONOGRAFIAS = /^ap[eê]ndice [a-z] [–-]/i
const MINERAIS = new Set(['calcio', 'sodio', 'potassio', 'magnesio', 'zinco', 'ferro', 'litio', 'aluminio'])

/** Nome sem o sal ("cloridrato de", "sódica"), para achar "dipirona" em "dipirona sódica". */
export function chavesDoNome(nome: string): string[] {
  const completo = semAcento(nome)
  const chaves = new Set([completo])
  if (completo.includes('+')) return [...chaves]
  // "omeprazol e omeprazol sódico", "sulfato ferroso ou sulfato ferroso heptaidratado"
  const partes = completo.split(/ ou | e (?=\S+)/).filter((parte, i, all) => i === 0 || completo.includes(' ou ') || parte.split(' ')[0] === all[0].split(' ')[0])
  for (const parte of partes.length > 1 ? partes : [completo]) {
    const semParenteses = parte.replace(/\s*\([^)]*\)?/g, '').trim()
    const semPrefixo = semParenteses.replace(/^(?:\S+ato|cloridrato|dicloridrato|bromidrato|brometo)(?: \S+)? de /, '')
    const semSufixo = semPrefixo.replace(/ (?:sodic[oa]|dissodic[oa]|potassic[oa]|calcic[oa]|magnesic[oa]|(?:mono|di|tri|hepta)-?i?hidratad[oa]|heptaidratad[oa])$/, '')
    for (const c of [parte, semParenteses, semPrefixo, semSufixo]) if (c.length >= 5 && !MINERAIS.has(c)) chaves.add(c)
  }
  return [...chaves]
}

/**
 * O nome do remédio sai do PDF com maiúsculas embaralhadas ("PArACETAmoL"),
 * por causa da fonte em versalete; o nome do autor sai normal ("Maria Isabel").
 */
function pareceNome(linha: string): boolean {
  const letras = linha.replace(/[^a-zA-ZÀ-ÿ]/g, '')
  if (letras.length < 3) return false
  const maiusculas = letras.replace(/[^A-ZÀ-Þ]/g, '').length
  return maiusculas / letras.length > 0.28
}

/**
 * Tira do nome o que veio junto no cabeçalho: remissões a outras monografias
 * ("atropina (ver sulfato de atropina)"), "(ver também ...)" e a nota sobre a
 * seção de soroterapia.
 */
export function nomeDoCabecalho(texto: string): string {
  let nome = texto.toLowerCase().replace(/\s+/g, ' ').trim()
  nome = nome.replace(/^ver também a seção .*?página \d+\s*/, '')
  for (;;) {
    const m = nome.match(/^.*?\(ver (?!também)[^)]*\)\s*(.+)$/)
    if (!m) break
    nome = m[1]
  }
  // Fim de uma remissão que começou antes das linhas lidas: "... de sódio) melfalana".
  const fecha = nome.indexOf(')')
  if (fecha >= 0 && !nome.slice(0, fecha).includes('(')) nome = nome.slice(fecha + 1).trim()
  return nome.replace(/\s*\(ver também[^)]*\)?\s*$/, '').replace(/\s*\(ver [^)]*$/, '').trim()
}

/** Junta as palavras partidas no fim da linha ("paraceta-\nmol"). */
function juntarLinhas(texto: string): string {
  return texto.replace(/-\n(?=[a-zà-ú])/g, '').trim()
}

/** Índice das monografias a partir do texto de cada página do PDF. */
export function monografiasDoFtn(pages: { num: number; text: string }[]): Monografia[] {
  const linhas: { page: number; text: string }[] = []
  for (const p of pages) {
    for (const raw of p.text.split('\n')) {
      const text = raw.trim()
      if (text && !RODAPE.some((r) => r.test(text))) linhas.push({ page: p.num, text })
    }
  }

  // Cabeçalho: nome (uma ou mais linhas), autores e "Na Rename 2010: item ...".
  const cabecalhos: { inicio: number; nome: string; corpo: number }[] = []
  linhas.forEach((l, i) => {
    if (!MARCA.test(l.text)) return
    let j = i - 1
    while (j >= 0 && i - j <= 3 && !pareceNome(linhas[j].text)) j--
    const nome: string[] = []
    while (j >= 0 && nome.length < 4 && pareceNome(linhas[j].text)) {
      nome.unshift(linhas[j].text)
      j--
    }
    const limpo = nomeDoCabecalho(nome.join(' '))
    if (limpo) cabecalhos.push({ inicio: j + 1, nome: limpo, corpo: i })
  })
  // O exemplo das "instruções de uso", no começo do livro, não é monografia.
  const validos = cabecalhos.filter((c, k) => k + 1 >= cabecalhos.length || linhas[cabecalhos[k + 1].inicio].page - linhas[c.inicio].page <= 50)

  return validos.map(({ inicio, nome, corpo: marca }, k) => {
    // A última monografia acaba antes das referências do fim do livro.
    let fim = k + 1 < validos.length ? validos[k + 1].inicio : linhas.findIndex((l) => l.page > linhas[inicio].page + 2)
    if (fim < 0) fim = linhas.length
    const apendice = linhas.slice(marca, fim).findIndex((l) => FIM_DAS_MONOGRAFIAS.test(l.text))
    if (apendice >= 0) fim = marca + apendice
    const corpo = linhas.slice(marca, fim)
    return {
      nome,
      chaves: chavesDoNome(nome),
      pagina: linhas[inicio].page,
      paginaFim: corpo.length ? corpo[corpo.length - 1].page : linhas[inicio].page,
      texto: juntarLinhas([nome, ...corpo.map((l) => l.text)].join('\n')),
    }
  })
}

/** Monografias cujo nome aparece no texto (pergunta ou busca), a de nome mais longo primeiro. */
export function monografiasCitadas(texto: string, monografias: Monografia[], max = 2): Monografia[] {
  let alvo = ` ${semAcento(texto).replace(/[^a-z0-9+ ]+/g, ' ').replace(/\s+/g, ' ')} `
  for (const [apelido, nome] of Object.entries(APELIDOS_NO_FTN)) if (alvo.includes(` ${apelido} `)) alvo += `${nome} `
  const achadas = monografias
    .map((m) => ({ m, chave: m.chaves.filter((c) => alvo.includes(` ${c} `)).sort((a, b) => b.length - a.length)[0] }))
    .filter((x) => x.chave)
    .sort((a, b) => b.chave!.length - a.chave!.length || a.m.nome.length - b.m.nome.length)
  // Uma por remédio: "amoxicilina" não traz junto "amoxicilina + clavulanato".
  const usadas: string[] = []
  const out: Monografia[] = []
  for (const { m, chave } of achadas) {
    if (usadas.some((u) => u.includes(chave!) || chave!.includes(u))) continue
    usadas.push(chave!)
    out.push(m)
    if (out.length >= max) break
  }
  return out
}

/** Busca pelo nome digitado na tela: igual, ou começando com o que foi digitado. */
export function monografiasPorNome(q: string, monografias: Monografia[], max = 5): Monografia[] {
  const termo = semAcento(q)
  if (termo.length < 3) return []
  const exatas = monografiasCitadas(q, monografias, max)
  const comeco = monografias.filter((m) => !exatas.includes(m) && m.chaves.some((c) => c.startsWith(termo) || c.split(' ').some((w) => w.startsWith(termo))))
  return [...exatas, ...comeco].slice(0, max)
}

/** Seções que a IA lê e o espaço de cada uma: dose e interações têm prioridade. */
const SECOES_PARA_A_IA: [RegExp, number][] = [
  [/^apresenta[cç](?:ão|ões)(?![a-zà-ú])/i, 250],
  [/^indica[cç](?:ão|ões)(?![a-zà-ú])/i, 450],
  [/^contraindica[cç](?:ão|ões)(?![a-zà-ú])/i, 400],
  [/^precau[cç](?:ão|ões)(?![a-zà-ú])/i, 600],
  [/^esquemas? de administra[cç]ão(?![a-zà-ú])/i, 1600],
  [/^efeitos adversos(?![a-zà-ú])/i, 450],
  [/^intera[cç](?:ão|ões) de medicamentos(?![a-zà-ú])/i, 900],
  [/^orienta[cç](?:ão|ões) a(?:o|os) paciente/i, 600],
]
// O número da referência pode vir colado: "Esquemas de administração1-3".
const OUTRAS_SECOES = /^(aspectos farmacocin[eé]ticos|aspectos farmac[eê]uticos|refer[eê]ncias)(?![a-zà-ú])/i

const FAIXA_ETARIA = /^(crian[cç]as?|adultos?|idosos?|lactentes?|rec[eé]m-nascidos?|neonatos?|adolescentes?|gestantes?)\b[^•]{0,60}$/i

const cortar = (texto: string, limite: number) =>
  texto.length > limite ? `${texto.slice(0, limite).replace(/\s+\S*$/, '')} […]` : texto

/**
 * O que a IA precisa da monografia: indicações, contraindicações, precauções,
 * doses, efeitos adversos, interações e orientações ao paciente, cada parte com
 * um limite, para a dose nunca ficar de fora, e o todo com até 6.000
 * caracteres. Farmacocinética, armazenamento e referências não entram.
 */
export function monografiaParaIa(m: Monografia): string {
  const secoes: { titulo: string; limite: number; linhas: string[] }[] = []
  let atual: (typeof secoes)[number] | null = null
  for (const linha of m.texto.split('\n').slice(1)) {
    const secao = SECOES_PARA_A_IA.find(([re]) => re.test(linha))
    if (secao) {
      atual = { titulo: linha.replace(/[\s\d,\-–]+$/, ''), limite: secao[1], linhas: [] }
      secoes.push(atual)
    } else if (OUTRAS_SECOES.test(linha) || MARCA.test(linha)) {
      atual = null
    } else if (atual) {
      // Faixa de idade em destaque, para a dose de adulto não se misturar com a de criança.
      atual.linhas.push(FAIXA_ETARIA.test(linha) ? `▸ ${linha.toUpperCase()}` : linha)
    }
  }
  const texto = [m.nome.toUpperCase(), ...secoes.map((sec) => `${sec.titulo}:\n${cortar(sec.linhas.join('\n'), sec.limite)}`)].join('\n\n')
  // Algumas monografias juntam vários produtos, cada um com as suas seções.
  return cortar(texto, 6000)
}
