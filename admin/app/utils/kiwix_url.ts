import type { DockerService } from '#services/docker_service'
import { SERVICE_NAMES } from '../../constants/service_names.js'

/** Porta em que o kiwix-serve escuta dentro do container. */
const KIWIX_CONTAINER_PORT = 8080

/**
 * Endereço do Kiwix visto pelo servidor, ou null se não estiver instalado. Em
 * produção o app roda na mesma rede Docker e fala com a porta interna do
 * container; em desenvolvimento usa a porta publicada no host.
 * KIWIX_INTERNAL_URL força um endereço.
 */
export async function resolveKiwixInternalUrl(dockerService: DockerService): Promise<string | null> {
  if (process.env.KIWIX_INTERNAL_URL) return process.env.KIWIX_INTERNAL_URL.replace(/\/$/, '')
  const published = await dockerService.getServiceURL(SERVICE_NAMES.KIWIX)
  if (!published) return null
  if (process.env.NODE_ENV === 'production') {
    return `http://${SERVICE_NAMES.KIWIX}:${KIWIX_CONTAINER_PORT}`
  }
  return published.replace(/\/$/, '')
}
