import type { ServiceSlim } from '../../types/services'
import { SERVICE_NAMES } from '../../constants/service_names'
import { getServiceLink } from '~/lib/navigation'

/**
 * Atalhos por necessidade da tela inicial. Os textos estão em inglês porque são
 * chaves de tradução. `href` nulo significa que o recurso não está instalado.
 */
export interface Need {
  id: string
  label: string
  /** Traço do ícone (path SVG, 24×24). */
  icon: string
  iconBg: string
  iconFg: string
  href: string | null
  /** Abre fora do Tropeiro (app em outra porta). */
  external?: boolean
}

const ICONS = {
  health: 'M12 5 V19 M5 12 H19',
  water: 'M12 3 C8 9 6 12 6 15 A6 6 0 0 0 18 15 C18 12 16 9 12 3 Z',
  shelter: 'M3 11 L12 4 L21 11 M6 10 V20 H18 V10',
  maps: 'M9 4 L3 6 V20 L9 18 L15 20 L21 18 V4 L15 6 L9 4 Z M9 4 V18 M15 6 V20',
  medicine: 'M5 15 L15 5 A3.5 3.5 0 0 1 20 10 L10 20 A3.5 3.5 0 0 1 5 15 Z M9.5 9.5 L14.5 14.5',
  learn: 'M3 6 C6 5 9 5 12 7 C15 5 18 5 21 6 V19 C18 18 15 18 12 20 C9 18 6 18 3 19 Z M12 7 V20',
  ai: 'M4 5 H20 V16 H10 L5 20 V16 H4 Z',
  library: 'M5 4 H9 V20 H5 Z M10 4 H14 V20 H10 Z M15 5 L19 4 L21 19 L17 20 Z',
}

function serviceHref(services: ServiceSlim[], name: string): string | null {
  const s = services.find((x) => x.service_name === name && x.installed)
  if (!s || !(s.ui_location || s.custom_url)) return null
  return getServiceLink(s.ui_location || '', s.custom_url)
}

const search = (q: string) => `/novo/busca?q=${encodeURIComponent(q)}`

export function buildNeeds(services: ServiceSlim[], drugReferenceInstalled: boolean): Need[] {
  const education =
    serviceHref(services, SERVICE_NAMES.KOLIBRI_GEN2) ?? serviceHref(services, SERVICE_NAMES.KOLIBRI)
  const ollama = services.some((s) => s.service_name === SERVICE_NAMES.OLLAMA && s.installed)

  return [
    { id: 'health', label: 'Health and first aid', icon: ICONS.health, iconBg: '#FCE4E1', iconFg: '#8A1C12', href: '/novo/fichas' },
    { id: 'water', label: 'Water and food', icon: ICONS.water, iconBg: '#DDEBF7', iconFg: '#1B4F7A', href: search('água potável') },
    { id: 'shelter', label: 'Shelter and safety', icon: ICONS.shelter, iconBg: '#FFF1CC', iconFg: '#7A4B00', href: search('abrigo') },
    { id: 'maps', label: 'Maps', icon: ICONS.maps, iconBg: '#E3EFE7', iconFg: '#14492F', href: '/novo/mapa' },
    { id: 'medicine', label: 'Medicines', icon: ICONS.medicine, iconBg: '#EDE7F6', iconFg: '#4A2C7A', href: drugReferenceInstalled ? '/drug-reference' : null },
    { id: 'library', label: 'Encyclopedia', icon: ICONS.library, iconBg: '#E8EEF0', iconFg: '#2C4650', href: serviceHref(services, SERVICE_NAMES.KIWIX), external: true },
    { id: 'learn', label: 'Learn', icon: ICONS.learn, iconBg: '#E8EEF0', iconFg: '#2C4650', href: education, external: true },
    { id: 'ai', label: 'Ask the AI', icon: ICONS.ai, iconBg: '#E3EFE7', iconFg: '#14492F', href: ollama ? '/novo/perguntar' : null },
  ]
}
