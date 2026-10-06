import type { Guide, GuideTrack } from '../../../types/guias.js'
import { RADIO_GUIDES } from './radio.js'

/** Trilhas de aprendizado, na ordem em que aparecem na tela de guias. */
export const GUIDE_TRACKS: GuideTrack[] = [
  {
    id: 'radio',
    title: 'Comunicação por rádio',
    description:
      'Do zero ao operador: como o rádio funciona, quais rádios dá para usar sem licença, como tirar a licença de radioamador e como se comunicar quando celular e internet caem.',
  },
]

export const GUIDES: Guide[] = [...RADIO_GUIDES].sort((a, b) =>
  a.track === b.track ? a.order - b.order : a.track.localeCompare(b.track)
)
