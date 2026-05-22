/**
 * Pure helpers for the @-mention markup used across saved text fields.
 *
 * A mention is stored inline in the text as `@[Full Name](userId)`. This keeps
 * the underlying String columns untouched (no schema migration) and renders to a
 * chip/link on read. Framework-agnostic — safe to import in client and server.
 */

/** Matches a single mention token: `@[Full Name](userId)`. */
// Name = anything but a closing bracket; id = cuid-like (letters/digits), no parens.
export const MENTION_REGEX = /@\[([^\]]+)\]\(([^)]+)\)/g

export interface MentionToken {
  type: 'mention'
  userId: string
  name: string
}
export interface TextToken {
  type: 'text'
  value: string
}
export type Token = MentionToken | TextToken

/** Build the inline markup for a single mention. */
export function toMentionMarkup(name: string, userId: string): string {
  // Strip characters that would break the markup grammar.
  const safeName = name.replace(/[[\]()]/g, '').trim()
  return `@[${safeName}](${userId})`
}

/** Unique user ids referenced by mentions in the text, in first-seen order. */
export function extractMentionUserIds(text: string | null | undefined): string[] {
  if (!text) return []
  const ids: string[] = []
  const seen = new Set<string>()
  for (const match of text.matchAll(MENTION_REGEX)) {
    const id = match[2]
    if (id && !seen.has(id)) {
      seen.add(id)
      ids.push(id)
    }
  }
  return ids
}

/** Split text into plain-text and mention tokens for rendering. */
export function tokenize(text: string | null | undefined): Token[] {
  if (!text) return []
  const tokens: Token[] = []
  let lastIndex = 0
  for (const match of text.matchAll(MENTION_REGEX)) {
    const start = match.index ?? 0
    if (start > lastIndex) {
      tokens.push({ type: 'text', value: text.slice(lastIndex, start) })
    }
    tokens.push({ type: 'mention', name: match[1] ?? '', userId: match[2] ?? '' })
    lastIndex = start + match[0].length
  }
  if (lastIndex < text.length) {
    tokens.push({ type: 'text', value: text.slice(lastIndex) })
  }
  return tokens
}

/** Plain-text version of the markup (mentions become `@Name`). For previews/excerpts. */
export function toPlainText(text: string | null | undefined): string {
  if (!text) return ''
  return text.replace(MENTION_REGEX, (_m, name: string) => `@${name}`)
}

/** A short single-line excerpt of the plain text, for notification bodies. */
export function buildExcerpt(text: string | null | undefined, max = 140): string {
  const plain = toPlainText(text).replace(/\s+/g, ' ').trim()
  return plain.length > max ? `${plain.slice(0, max - 1)}…` : plain
}
