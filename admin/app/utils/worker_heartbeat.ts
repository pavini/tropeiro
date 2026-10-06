/**
 * Sinal de vida do worker de filas. O worker grava a hora no Redis a cada
 * poucos segundos; o servidor web lê para saber se os downloads estão sendo
 * processados de fato ou se o worker caiu e a fila só parece andar.
 */

/** O mínimo do ioredis que o sinal de vida usa. */
interface HeartbeatStore {
  set(key: string, value: string, mode: 'EX', seconds: number): Promise<unknown>
  get(key: string): Promise<string | null>
}

export const WORKER_HEARTBEAT_KEY = 'tropeiro:worker:heartbeat'
export const WORKER_HEARTBEAT_INTERVAL_MS = 10_000
/** A chave expira sozinha se o worker morrer. */
const WORKER_HEARTBEAT_TTL_S = 60
/** Sem sinal há mais que isso, o worker é considerado parado. */
export const WORKER_HEARTBEAT_STALE_MS = 45_000

export async function writeWorkerHeartbeat(store: HeartbeatStore, now = Date.now()): Promise<void> {
  await store.set(WORKER_HEARTBEAT_KEY, String(now), 'EX', WORKER_HEARTBEAT_TTL_S)
}

/** true: worker vivo; false: sem sinal recente; null: não deu para consultar. */
export async function isWorkerAlive(store: HeartbeatStore, now = Date.now()): Promise<boolean | null> {
  try {
    const value = await store.get(WORKER_HEARTBEAT_KEY)
    if (!value) return false
    const last = Number(value)
    return Number.isFinite(last) && now - last < WORKER_HEARTBEAT_STALE_MS
  } catch {
    return null
  }
}
