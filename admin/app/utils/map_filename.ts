/**
 * Lê o id e a versão de um arquivo de mapa no disco. Dois formatos:
 * - coleções do catálogo: `<id>_AAAA-MM.pmtiles`
 * - países/regiões recortados: `<id>_AAAAMMDD_z<zoom>.pmtiles` (RunExtractPmtilesJob
 *   registra o id da região e a data do mapa mundial como versão)
 */
export function parseMapFilename(filename: string): { resource_id: string; version: string } | null {
  const name = filename.replace(/\.pmtiles$/, '')
  const curated = name.match(/^(.+)_(\d{4}-\d{2})$/)
  if (curated) return { resource_id: curated[1], version: curated[2] }
  const extracted = name.match(/^(.+)_(\d{8})_z\d{1,2}$/)
  if (extracted) return { resource_id: extracted[1], version: extracted[2] }
  return null
}
