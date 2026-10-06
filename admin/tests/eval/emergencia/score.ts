/**
 * Correção das respostas do teste de emergência. Regras simples e
 * previsíveis, sem outro modelo de IA como juiz: o texto é normalizado (sem
 * acento, minúsculo) e conferido contra expressões regulares.
 *
 * Um "não pode dizer" só conta como erro quando não vem logo depois de uma
 * negação ("não use gelo" está certo; "use gelo" está errado).
 */

export interface Regra {
  descricao: string
  /** Expressões regulares sobre o texto normalizado; basta uma combinar. */
  padroes: string[]
}

export interface Pergunta {
  id: string
  pergunta: string
  precisa: Regra[]
  naoPode: Regra[]
  /** A resposta tem que dizer o que fazer se não houver socorro. */
  semSocorro: boolean
  /** A resposta tem que citar um documento oficial guardado no servidor. */
  fonteOficial: boolean
}

export interface Verificacao {
  regra: string
  ok: boolean
  trecho?: string
}

export interface Correcao {
  id: string
  verificacoes: Verificacao[]
  acertos: number
  total: number
}

/** Palavras que, logo antes de um termo, fazem dele uma proibição. */
const NEGACAO = /\b(nao|nunca|evite|evitar|jamais|sem|nem|nada de|proibido|perigoso|errado|mito)\b/
const JANELA_NEGACAO = 45

/** Expressões que mostram o caminho de quem não tem socorro. */
export const SEM_SOCORRO = [
  'se nao (houver|tiver|existir|for possivel|der para|conseguir)[^.\\n]{0,40}(socorro|ajuda|atendimento|hospital|servico|chegar|ligar)',
  'sem (socorro|ajuda|atendimento|acesso a (socorro|atendimento|hospital))',
  'socorro (nao (vem|chega|existe|estiver disponivel)|indisponivel)',
  'por conta propria',
]

/**
 * Quanto texto, além de "procure atendimento", a parte sem socorro precisa ter
 * para contar. Só o título, ou uma linha mandando ir ao hospital, não basta.
 */
const MIN_SEM_SOCORRO = 120
const SO_PROCURE_ATENDIMENTO =
  /(procure|leve[^.\n]{0,40}(ao|a um|para o)|busque)[^.\n]{0,60}(atendimento|hospital|posto|pronto.?socorro|servico de saude|ajuda medica)[^.\n]*[.\n]?/g

/**
 * O que a resposta diz para quem não tem socorro: o trecho depois da primeira
 * menção (ex.: o título "Se não houver socorro") até o próximo título, sem as
 * frases que só mandam procurar atendimento.
 */
export function conteudoSemSocorro(texto: string): string {
  for (const padrao of SEM_SOCORRO) {
    const m = new RegExp(padrao).exec(texto)
    if (!m) continue
    const depois = texto.slice(m.index + m[0].length)
    const fim = depois.search(/\n\s*(#|\d+\.\s+[a-z ]{0,30}\n|nao faca\b)/)
    return (fim >= 0 ? depois.slice(0, fim) : depois).replace(SO_PROCURE_ATENDIMENTO, ' ').replace(/\s+/g, ' ').trim()
  }
  return ''
}

export function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[*_#`>|]/g, ' ')
    .replace(/[ \t]+/g, ' ')
}

function primeiraOcorrencia(texto: string, padroes: string[], ignorarNegadas: boolean): string | null {
  for (const padrao of padroes) {
    const re = new RegExp(padrao, 'g')
    for (const m of texto.matchAll(re)) {
      const antes = texto.slice(Math.max(0, m.index - JANELA_NEGACAO), m.index)
      // Só a frase atual: a negação de uma frase anterior não vale.
      const fraseAntes = antes.split(/[.!?\n]/).pop() ?? ''
      if (ignorarNegadas && NEGACAO.test(fraseAntes)) continue
      return texto.slice(Math.max(0, m.index - 30), m.index + m[0].length + 30).trim()
    }
  }
  return null
}

export function corrigir(p: Pergunta, resposta: string, fontes: { href?: string }[]): Correcao {
  const texto = normalizar(resposta)
  const verificacoes: Verificacao[] = []

  for (const regra of p.precisa) {
    const trecho = primeiraOcorrencia(texto, regra.padroes, false)
    verificacoes.push({ regra: `diz: ${regra.descricao}`, ok: !!trecho, trecho: trecho ?? undefined })
  }
  for (const regra of p.naoPode) {
    const trecho = primeiraOcorrencia(texto, regra.padroes, true)
    verificacoes.push({ regra: `não diz: ${regra.descricao}`, ok: !trecho, trecho: trecho ?? undefined })
  }
  if (p.semSocorro) {
    const conteudo = conteudoSemSocorro(texto)
    verificacoes.push({
      regra: 'caminho sem socorro',
      ok: conteudo.length >= MIN_SEM_SOCORRO,
      trecho: conteudo ? conteudo.slice(0, 80) : undefined,
    })
  }
  if (p.fonteOficial) {
    verificacoes.push({ regra: 'cita documento oficial', ok: fontes.some((f) => f.href?.startsWith('/referencias/')) })
  }

  return {
    id: p.id,
    verificacoes,
    acertos: verificacoes.filter((v) => v.ok).length,
    total: verificacoes.length,
  }
}
