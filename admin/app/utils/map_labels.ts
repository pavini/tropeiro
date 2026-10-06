/**
 * O estilo do mapa vem com os nomes em inglês (["get", "name:en"]). Troca cada
 * um pelo nome no idioma pedido, caindo no inglês e depois no nome local
 * quando o lugar não tem tradução. Sem dependências, para poder testar.
 */
export function localizeLabels<T>(style: T, lang: string): T {
  const field = `name:${lang}`
  const walk = (node: unknown): unknown => {
    if (Array.isArray(node)) {
      if (node.length === 2 && node[0] === 'get' && node[1] === 'name:en') {
        return ['coalesce', ['get', field], ['get', 'name:en'], ['get', 'name']]
      }
      return node.map(walk)
    }
    if (node && typeof node === 'object') {
      return Object.fromEntries(Object.entries(node).map(([k, v]) => [k, walk(v)]))
    }
    return node
  }
  return walk(style) as T
}
