import { DockerService } from '#services/docker_service'
import { RagService } from '#services/rag_service'
import Service from '#models/service'
import KVStore from '#models/kv_store'
import { assertNotCloudMetadataUrl } from '#validators/common'
import { inject } from '@adonisjs/core'
import logger from '@adonisjs/core/services/logger'
import { SERVICE_NAMES } from '../../constants/service_names.js'

export type RemoteOllamaProbe =
  | { ok: true; models: string[] }
  | { ok: false; reason: 'invalid_url' | 'unreachable'; status?: number; message: string }

export type RemoteOllamaResult =
  | { success: true; message: string; localRestored?: boolean }
  | { success: false; reason: 'not_found' | 'invalid_url' | 'unreachable'; message: string }

/**
 * IA (Ollama ou outro servidor compatível) em outro endereço: testar, usar e
 * voltar para a deste servidor. Usado pela tela clássica e pela nova.
 */
@inject()
export class RemoteOllamaService {
  constructor(
    private dockerService: DockerService,
    private ragService: RagService
  ) {}

  /** Endereço configurado, ou null quando a IA roda neste servidor. */
  async url(): Promise<string | null> {
    const url = await KVStore.getValue('ai.remoteOllamaUrl')
    return url && url.trim() ? url.trim() : null
  }

  /**
   * Testa o endereço pelo /v1/models (Ollama, LM Studio, llama.cpp...) e
   * devolve os modelos que ele tem. Não grava nada.
   */
  async probe(remoteUrl: string, timeoutMs = 5000): Promise<RemoteOllamaProbe> {
    try {
      assertNotCloudMetadataUrl(remoteUrl)
    } catch (err) {
      return { ok: false, reason: 'invalid_url', message: err instanceof Error ? err.message : 'Invalid URL.' }
    }
    const base = remoteUrl.trim().replace(/\/$/, '')
    try {
      const res = await fetch(`${base}/v1/models`, { signal: AbortSignal.timeout(timeoutMs) })
      if (!res.ok) {
        return {
          ok: false,
          reason: 'unreachable',
          status: res.status,
          message: `Could not connect to ${remoteUrl} (HTTP ${res.status}). Make sure the server is running and accessible. For Ollama, start it with OLLAMA_HOST=0.0.0.0.`,
        }
      }
      const body = (await res.json().catch(() => null)) as { data?: { id?: unknown }[] } | null
      const models = Array.isArray(body?.data)
        ? body!.data.map((m) => m?.id).filter((id): id is string => typeof id === 'string')
        : []
      return { ok: true, models }
    } catch {
      return {
        ok: false,
        reason: 'unreachable',
        message: `Could not connect to ${remoteUrl}. Make sure the server is running and reachable. For Ollama, start it with OLLAMA_HOST=0.0.0.0.`,
      }
    }
  }

  /** O endereço configurado está respondendo? */
  async status(): Promise<{ configured: boolean; connected: boolean; url: string | null }> {
    const url = await this.url()
    if (!url) return { configured: false, connected: false, url: null }
    const probe = await this.probe(url, 3000)
    return { configured: true, connected: probe.ok, url }
  }

  /**
   * Passa a usar a IA do endereço dado. Vazio ou null volta para a deste
   * servidor, religando o contêiner local se ele existir.
   */
  async configure(remoteUrl: string | null): Promise<RemoteOllamaResult> {
    const ollamaService = await Service.query().where('service_name', SERVICE_NAMES.OLLAMA).first()
    if (!ollamaService) {
      return { success: false, reason: 'not_found', message: 'Ollama service record not found.' }
    }

    // Limpar: se ainda há contêiner local (a IA já foi instalada aqui), religa e
    // mantém o serviço como instalado; senão, volta a não instalado.
    if (!remoteUrl || remoteUrl.trim() === '') {
      await KVStore.clearValue('ai.remoteOllamaUrl')
      const hasLocalContainer = await this.startLocalContainerIfExists()
      ollamaService.installed = hasLocalContainer
      ollamaService.installation_status = 'idle'
      await ollamaService.save()
      return {
        success: true,
        localRestored: hasLocalContainer,
        message: hasLocalContainer
          ? 'Remote Ollama cleared. Local Ollama container restored.'
          : 'Remote Ollama configuration cleared.',
      }
    }

    const probe = await this.probe(remoteUrl)
    if (!probe.ok) return { success: false, reason: probe.reason, message: probe.message }

    await KVStore.setValue('ai.remoteOllamaUrl', remoteUrl.trim())
    ollamaService.installed = true
    ollamaService.installation_status = 'idle'
    await ollamaService.save()

    // Para o contêiner local (se estiver rodando) para não disputar a placa de
    // vídeo nem a porta 11434 com o endereço externo. Contêiner e modelos ficam.
    await this.stopLocalContainer()

    // Base de conhecimento: instala o Qdrant se faltar (em segundo plano).
    const qdrantService = await Service.query().where('service_name', SERVICE_NAMES.QDRANT).first()
    if (qdrantService && !qdrantService.installed) {
      this.dockerService.createContainerPreflight(SERVICE_NAMES.QDRANT).catch((error) => {
        logger.error('[RemoteOllamaService] Failed to start Qdrant preflight:', error)
      })
    }

    // Mesmos efeitos de depois de instalar a IA: sem sugestões, procura os documentos.
    await KVStore.setValue('chat.suggestionsEnabled', false)
    this.ragService.discoverNomadDocs().catch((error) => {
      logger.error('[RemoteOllamaService] Failed to discover Nomad docs:', error)
    })

    return { success: true, message: 'Remote Ollama configured.' }
  }

  private async stopLocalContainer(): Promise<void> {
    try {
      const containers = await this.dockerService.docker.listContainers({ all: true })
      const container = containers.find((c) => c.Names.includes(`/${SERVICE_NAMES.OLLAMA}`))
      if (!container || container.State !== 'running') return
      await this.dockerService.docker.getContainer(container.Id).stop()
      this.dockerService.invalidateServicesStatusCache()
      logger.info('[RemoteOllamaService] Stopped local nomad_ollama (remote Ollama configured)')
    } catch (error: any) {
      logger.error({ err: error }, '[RemoteOllamaService] Failed to stop local nomad_ollama; remote Ollama is still active')
    }
  }

  private async startLocalContainerIfExists(): Promise<boolean> {
    try {
      const containers = await this.dockerService.docker.listContainers({ all: true })
      const container = containers.find((c) => c.Names.includes(`/${SERVICE_NAMES.OLLAMA}`))
      if (!container) return false
      if (container.State !== 'running') {
        await this.dockerService.docker.getContainer(container.Id).start()
        this.dockerService.invalidateServicesStatusCache()
        logger.info('[RemoteOllamaService] Started local nomad_ollama (remote Ollama cleared)')
      }
      return true
    } catch (error: any) {
      logger.error({ err: error }, '[RemoteOllamaService] Failed to start local nomad_ollama on remote clear')
      return false
    }
  }
}
