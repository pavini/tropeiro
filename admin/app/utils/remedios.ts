/**
 * Remédios na interface nova: busca pelo nome usado no Brasil, situações,
 * estado da base e comparação. As listas de nomes ficam em constants/remedios.ts.
 */

import { APELIDOS_NO_FTN, FORA_DOS_EUA, NOMES_NAS_BULAS } from '../../constants/remedios.js'

export function semAcento(text: string): string {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim()
}

export interface BuscaDeRemedio {
  /** O que vai para a busca nas bulas. */
  termo: string
  /** Nome no Brasil que foi trocado pelo das bulas, se houve troca. */
  traduzidoDe: string | null
  /** Quando o remédio não existe nos EUA: chave de tradução do motivo e o parecido. */
  foraDosEua: { motivo: string; parecido: string | null } | null
}

/** Prepara o que a pessoa digitou para buscar nas bulas americanas. */
export function buscaDeRemedio(q: string): BuscaDeRemedio {
  const original = q.trim().replace(/\s+/g, ' ')
  const chave = semAcento(original)
  const fora = FORA_DOS_EUA[chave]
  if (fora) return { termo: original, traduzidoDe: null, foraDosEua: { motivo: fora.motivo, parecido: fora.parecido ?? null } }
  const ingles = NOMES_NAS_BULAS[chave]
  if (ingles && ingles !== chave) return { termo: ingles, traduzidoDe: original, foraDosEua: null }
  return { termo: original, traduzidoDe: null, foraDosEua: null }
}

/** Situações cujo nome (já traduzido) combina com o texto, sem ligar para acento e caixa. */
export function situacoesQueCombinam<T extends { label: string }>(situacoes: T[], q: string, traduzir: (s: string) => string): T[] {
  const termo = semAcento(q)
  if (termo.length < 3) return []
  return situacoes.filter((s) => semAcento(traduzir(s.label)).includes(termo) || semAcento(s.label).includes(termo))
}

/** Situação de instalação da base, do jeito que a tela precisa. */
export type EstadoDaBase = 'ausente' | 'baixando' | 'baixada' | 'organizando' | 'pronta' | 'falhou'

export function estadoDaBase(phase: string, rowCount: number): EstadoDaBase {
  switch (phase) {
    case 'downloading':
      return 'baixando'
    case 'downloaded':
      return 'baixada'
    case 'ingesting':
      return 'organizando'
    case 'failed':
      return 'falhou'
    case 'ready':
      return 'pronta'
    default:
      return rowCount > 0 ? 'pronta' : 'ausente'
  }
}

/** O que o botão "baixar" ou "tentar de novo" deve fazer em cada situação. */
export function acaoParaInstalar(estado: EstadoDaBase): 'baixar' | 'organizar' | 'recomecar' | null {
  if (estado === 'ausente') return 'baixar'
  if (estado === 'baixada') return 'organizar'
  if (estado === 'falhou') return 'recomecar'
  return null
}

/** Quantos princípios ativos o remédio tem (pelo nome genérico, separado por vírgula). */
function ingredientes(genericName: string | null): number {
  return Math.max(1, (genericName ?? '').split(',').filter((s) => s.trim()).length)
}

/** Remédios mais simples (um princípio ativo só) primeiro, sem mudar a ordem entre iguais. */
export function simplesPrimeiro<T extends { generic_name: string | null }>(list: T[]): T[] {
  return list
    .map((d, i) => ({ d, i }))
    .sort((a, b) => ingredientes(a.d.generic_name) - ingredientes(b.d.generic_name) || a.i - b.i)
    .map(({ d }) => d)
}

/**
 * Quais dos outros remédios escolhidos aparecem no texto de interações deste,
 * pelo princípio ativo. Não é verificação de interação: só aponta onde a bula
 * fala do outro.
 */
export function mencionados<T extends { id: number; generic_name: string | null; drug_interactions: string | null }>(
  entry: T,
  others: T[]
): T[] {
  const texto = semAcento(entry.drug_interactions ?? '')
  if (!texto) return []
  return others.filter((o) => {
    if (o.id === entry.id) return false
    return (o.generic_name ?? '')
      .split(',')
      // "WARFARIN SODIUM" é citado como "warfarin": vale a primeira palavra do sal.
      .map((s) => semAcento(s).split(' ')[0])
      .filter((s) => s.length >= 4)
      .some((ingrediente) => new RegExp(`\\b${ingrediente.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`).test(texto))
  })
}

/**
 * Nomes, como estão nas bulas americanas, dos remédios citados num texto em
 * português ("paracetamol" → "acetaminophen"). Os apelidos ("AAS") contam.
 */
export function termosDaBula(texto: string, max = 2): string[] {
  let alvo = ` ${semAcento(texto).replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ')} `
  for (const [apelido, nome] of Object.entries(APELIDOS_NO_FTN)) if (alvo.includes(` ${apelido} `)) alvo += `${nome} `
  const achados = Object.keys(NOMES_NAS_BULAS)
    .filter((nome) => alvo.includes(` ${nome} `))
    .sort((a, b) => alvo.indexOf(` ${a} `) - alvo.indexOf(` ${b} `))
  return [...new Set(achados.map((nome) => NOMES_NAS_BULAS[nome]))].slice(0, max)
}

/** Entre os resultados da busca, a bula do remédio puro (só aquele princípio ativo), de venda livre se houver. */
export function escolherBula<T extends { generic_name: string | null; product_type: string | null }>(
  results: T[],
  termo: string
): T | null {
  const alvo = semAcento(termo)
  const puros = results.filter((r) => {
    const g = semAcento(r.generic_name ?? '')
    return g === alvo || (g.startsWith(`${alvo} `) && !g.includes(','))
  })
  return puros.find((r) => r.product_type === 'HUMAN OTC DRUG') ?? puros[0] ?? null
}

/** As partes da bula que importam para uma resposta, cortadas no limite. */
export function bulaParaIa(
  label: {
    brand_name: string | null
    generic_name: string | null
    indications: string | null
    dosage: string | null
    contraindications: string | null
    warnings: string | null
    drug_interactions: string | null
    stop_use: string | null
  },
  limite = 2500
): string {
  const corte = (t: string | null, n: number) => {
    const limpo = (t ?? '').replace(/\s+/g, ' ').trim()
    return limpo.length > n ? `${limpo.slice(0, n).replace(/\s+\S*$/, '')} […]` : limpo
  }
  const partes: [string, string | null, number][] = [
    ['Uses', label.indications, 400],
    ['Directions', label.dosage, 700],
    ['Do not use', label.contraindications, 300],
    ['Warnings', label.warnings, 600],
    ['Drug interactions', label.drug_interactions, 500],
    ['Stop use and ask a doctor if', label.stop_use, 300],
  ]
  const nome = [label.brand_name, label.generic_name].filter(Boolean).join(' — ')
  const texto = [nome, ...partes.filter(([, t]) => t).map(([titulo, t, n]) => `${titulo}: ${corte(t, n)}`)].join('\n')
  return texto.length > limite ? `${texto.slice(0, limite)} […]` : texto
}

/** Nome no Brasil de um princípio ativo das bulas americanas ("ACETAMINOPHEN" → "paracetamol"). */
export function nomeNoBrasil(genericName: string | null): string | null {
  const alvo = semAcento(genericName ?? '')
  if (!alvo || alvo.includes(',')) return null
  const entrada = Object.entries(NOMES_NAS_BULAS).find(([, en]) => alvo === en || alvo.startsWith(`${en} `))
  return entrada ? entrada[0] : alvo
}
