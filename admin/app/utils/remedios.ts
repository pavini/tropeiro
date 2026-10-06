/**
 * Remédios na interface nova: busca pelo nome usado no Brasil, situações,
 * estado da base e comparação. As listas de nomes ficam em constants/remedios.ts.
 */

import { FORA_DOS_EUA, NOMES_NAS_BULAS } from '../../constants/remedios.js'

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
