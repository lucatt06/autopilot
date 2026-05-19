/**
 * Helpers to read/write the global "selected projects" filter
 * that lives in the URL as `?projects=id1,id2,id3`.
 *
 * Doc 1 §8.1 — selector de proyecto siempre visible (multi-checkbox)
 * filtra TODOS los menús del módulo Desarrollo Inmobiliario.
 */

export function parseProjectIdsFromParam(raw: unknown): string[] {
  if (!raw) return []
  const value = Array.isArray(raw) ? raw[0] : raw
  if (typeof value !== 'string' || value.length === 0) return []
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

export function serializeProjectIds(ids: string[]): string {
  return ids.join(',')
}
