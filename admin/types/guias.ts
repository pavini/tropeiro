import type { FichaRef } from './fichas.js'

/**
 * Guias: aulas em trilhas (ex.: comunicação por rádio), do básico ao avançado.
 * Como nas fichas, o texto é próprio e cada informação técnica ou legal vem de
 * um documento oficial guardado no servidor.
 */

export type GuideBlock =
  | { kind: 'text'; text: string }
  | { kind: 'list'; items: string[]; ordered?: boolean }
  | { kind: 'table'; caption?: string; columns: string[]; rows: string[][]; note?: string }
  /** Destaque: atenção, regra importante ou risco. */
  | { kind: 'note'; text: string }

export interface GuideSection {
  title: string
  blocks: GuideBlock[]
}

export interface Guide {
  slug: string
  /** Trilha a que pertence e a posição nela. */
  track: string
  order: number
  title: string
  /** Uma ou duas frases: o que a pessoa aprende. */
  summary: string
  /** Termos que a pessoa pode digitar na busca. */
  keywords: string[]
  sections: GuideSection[]
  refs: FichaRef[]
  reviewed: boolean
}

export interface GuideTrack {
  id: string
  title: string
  description: string
}
