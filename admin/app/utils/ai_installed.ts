/**
 * IA (Ollama) e base de conhecimento (Qdrant) instaladas: sem as duas, não há
 * o que indexar. Com Ollama em outro endereço, o serviço conta como instalado.
 */
export async function aiServicesInstalled(): Promise<boolean> {
  const app = (await import('@adonisjs/core/services/app')).default
  const { DockerService } = await import('#services/docker_service')
  const { SERVICE_NAMES } = await import('../../constants/service_names.js')
  const docker = await app.container.make(DockerService)
  const [qdrant, ollama] = await Promise.all([
    docker.getServiceURL(SERVICE_NAMES.QDRANT),
    docker.getServiceURL(SERVICE_NAMES.OLLAMA),
  ])
  return !!qdrant && !!ollama
}
