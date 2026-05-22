import { describe, it, expect } from 'vitest'

import {
  buildExcerpt,
  extractMentionUserIds,
  toMentionMarkup,
  toPlainText,
  tokenize,
} from './parse'

describe('toMentionMarkup', () => {
  it('builds the inline markup', () => {
    expect(toMentionMarkup('Ana Pérez', 'u1')).toBe('@[Ana Pérez](u1)')
  })
  it('strips bracket/paren chars that would break the grammar', () => {
    expect(toMentionMarkup('Ana [Pérez] (x)', 'u1')).toBe('@[Ana Pérez x](u1)')
  })
})

describe('extractMentionUserIds', () => {
  it('returns unique ids in first-seen order', () => {
    const t = 'Hola @[Ana](u1) y @[Beto](u2), cc @[Ana](u1)'
    expect(extractMentionUserIds(t)).toEqual(['u1', 'u2'])
  })
  it('returns [] for empty/plain text', () => {
    expect(extractMentionUserIds('')).toEqual([])
    expect(extractMentionUserIds('sin menciones')).toEqual([])
    expect(extractMentionUserIds(null)).toEqual([])
  })
})

describe('tokenize', () => {
  it('splits text and mentions preserving order', () => {
    const tokens = tokenize('Hola @[Ana](u1)!')
    expect(tokens).toEqual([
      { type: 'text', value: 'Hola ' },
      { type: 'mention', name: 'Ana', userId: 'u1' },
      { type: 'text', value: '!' },
    ])
  })
  it('handles a mention at the very start', () => {
    expect(tokenize('@[Ana](u1) hola')).toEqual([
      { type: 'mention', name: 'Ana', userId: 'u1' },
      { type: 'text', value: ' hola' },
    ])
  })
  it('returns a single text token when there are no mentions', () => {
    expect(tokenize('solo texto')).toEqual([{ type: 'text', value: 'solo texto' }])
  })
})

describe('toPlainText', () => {
  it('renders mentions as @Name', () => {
    expect(toPlainText('cc @[Ana Pérez](u1) ok')).toBe('cc @Ana Pérez ok')
  })
})

describe('buildExcerpt', () => {
  it('collapses whitespace and truncates with an ellipsis', () => {
    const long = 'a'.repeat(200)
    const ex = buildExcerpt(long, 140)
    expect(ex.length).toBe(140)
    expect(ex.endsWith('…')).toBe(true)
  })
  it('keeps short text intact', () => {
    expect(buildExcerpt('  hola   @[Ana](u1)  ')).toBe('hola @Ana')
  })
})
