'use client'

import { useSearchParams } from 'next/navigation'

import { parseProjectIdsFromParam } from './filter-utils'

/**
 * Project ids currently active in the global DI selector (`?projects=`).
 * Empty array = "all projects".
 */
export function useGlobalProjectIds(): string[] {
  const searchParams = useSearchParams()
  return parseProjectIdsFromParam(searchParams.getAll('projects'))
}

/**
 * The project the whole module should inherit, when the context unambiguously
 * points to a single project. Forms MUST hide their project picker and use this
 * value instead of asking the user to choose again.
 *
 * Resolution order:
 *   1. Project of the contextual building (when creating/editing within one).
 *   2. The single project selected in the global selector.
 *
 * Returns `undefined` only when the project is genuinely ambiguous (no global
 * selection or multiple projects selected, and no contextual building).
 *
 * Doc 1 §8.1 — the project selector filters the ENTIRE module; once a project
 * is chosen it must be inherited everywhere, never re-prompted.
 */
export function useInheritedProjectId(contextualProjectId?: string): string | undefined {
  const globalIds = useGlobalProjectIds()
  if (contextualProjectId) return contextualProjectId
  return globalIds.length === 1 ? globalIds[0] : undefined
}
