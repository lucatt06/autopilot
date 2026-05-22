'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'

import { cn } from '@/lib/utils'
import { tokenize, toMentionMarkup } from '@/lib/mentions/parse'
import { searchWorkspaceUsers, type WorkspaceUserOption } from '@/app/actions/notifications'

interface Props {
  value: string
  onChange: (markup: string) => void
  placeholder?: string
  id?: string
  className?: string
  disabled?: boolean
  /** Minimum visible rows (approx). */
  rows?: number
}

/** Build a non-editable chip element representing a mention. */
function makeChip(doc: Document, name: string, userId: string): HTMLSpanElement {
  const chip = doc.createElement('span')
  chip.contentEditable = 'false'
  chip.dataset.userId = userId
  chip.dataset.name = name
  chip.className = 'rounded bg-primary/10 px-1 font-medium text-primary'
  chip.textContent = `@${name}`
  return chip
}

/** Serialize the editor DOM back into `@[Name](userId)` markup. */
function serialize(root: HTMLElement): string {
  let out = ''
  root.childNodes.forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      out += node.textContent ?? ''
    } else if (node instanceof HTMLElement) {
      if (node.dataset.userId) {
        out += toMentionMarkup(node.dataset.name ?? '', node.dataset.userId)
      } else if (node.tagName === 'BR') {
        out += '\n'
      } else {
        out += node.textContent ?? ''
      }
    }
  })
  return out
}

/** Render markup string into the editor DOM (text nodes + chip spans). */
function hydrate(root: HTMLElement, markup: string) {
  const doc = root.ownerDocument
  root.replaceChildren()
  for (const token of tokenize(markup)) {
    if (token.type === 'mention') {
      root.appendChild(makeChip(doc, token.name, token.userId))
    } else {
      root.appendChild(doc.createTextNode(token.value))
    }
  }
}

export function MentionTextarea({ value, onChange, placeholder, id, className, disabled, rows = 2 }: Props) {
  const editorRef = useRef<HTMLDivElement>(null)
  const lastSerialized = useRef<string>(value)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [options, setOptions] = useState<WorkspaceUserOption[]>([])
  const [loading, setLoading] = useState(false)
  const [activeIdx, setActiveIdx] = useState(0)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // The text node + position of the active "@" being typed.
  const triggerRef = useRef<{ node: Text; atIndex: number; caretIndex: number } | null>(null)

  // Hydrate from the controlled value when it changes externally (e.g. form reset
  // or auto-fill) and the editor isn't the source of that change.
  useEffect(() => {
    const el = editorRef.current
    if (!el) return
    if (value !== lastSerialized.current) {
      hydrate(el, value)
      lastSerialized.current = value
    }
  }, [value])

  // Initial hydrate on mount.
  useEffect(() => {
    const el = editorRef.current
    if (el) hydrate(el, value)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const emitChange = useCallback(() => {
    const el = editorRef.current
    if (!el) return
    const markup = serialize(el)
    lastSerialized.current = markup
    onChange(markup)
  }, [onChange])

  // Detect whether the caret is currently typing an "@query" token.
  const detectTrigger = useCallback(() => {
    const sel = window.getSelection()
    const el = editorRef.current
    if (!sel || !sel.isCollapsed || !el || sel.rangeCount === 0) {
      setOpen(false)
      triggerRef.current = null
      return
    }
    const node = sel.anchorNode
    // Only trigger inside a plain text node that belongs to the editor.
    if (!node || node.nodeType !== Node.TEXT_NODE || (node.parentElement as HTMLElement)?.dataset.userId) {
      setOpen(false)
      triggerRef.current = null
      return
    }
    const textNode = node as Text
    const caret = sel.anchorOffset
    const before = (textNode.textContent ?? '').slice(0, caret)
    const at = before.lastIndexOf('@')
    if (at === -1) {
      setOpen(false)
      triggerRef.current = null
      return
    }
    const after = before.slice(at + 1)
    // No whitespace in the query; "@" must start the token (start or after space).
    const prevChar = at > 0 ? before[at - 1] : ' '
    if (/\s/.test(after) || !(prevChar === ' ' || prevChar === '\n' || at === 0)) {
      setOpen(false)
      triggerRef.current = null
      return
    }
    triggerRef.current = { node: textNode, atIndex: at, caretIndex: caret }
    setQuery(after)
    setActiveIdx(0)
    setOpen(true)
  }, [])

  // Debounced workspace-user search while a trigger is active.
  useEffect(() => {
    if (!open) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setLoading(true)
    debounceRef.current = setTimeout(async () => {
      const results = await searchWorkspaceUsers(query)
      setOptions(results)
      setLoading(false)
    }, 200)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query, open])

  const insertMention = useCallback((opt: WorkspaceUserOption) => {
    const el = editorRef.current
    const trig = triggerRef.current
    if (!el || !trig) return
    const doc = el.ownerDocument
    const { node, atIndex, caretIndex } = trig

    // Replace the "@query" slice with a chip + trailing space.
    const range = doc.createRange()
    range.setStart(node, atIndex)
    range.setEnd(node, caretIndex)
    range.deleteContents()

    const chip = makeChip(doc, opt.name, opt.id)
    const space = doc.createTextNode(' ')
    range.insertNode(space)
    range.insertNode(chip)

    // Caret after the trailing space.
    const sel = window.getSelection()
    const after = doc.createRange()
    after.setStartAfter(space)
    after.collapse(true)
    sel?.removeAllRanges()
    sel?.addRange(after)

    setOpen(false)
    triggerRef.current = null
    emitChange()
  }, [emitChange])

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (!open || options.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx((i) => (i + 1) % options.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx((i) => (i - 1 + options.length) % options.length)
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault()
      const opt = options[activeIdx]
      if (opt) insertMention(opt)
    } else if (e.key === 'Escape') {
      setOpen(false)
      triggerRef.current = null
    }
  }

  return (
    <div className="relative">
      <div
        ref={editorRef}
        id={id}
        role="textbox"
        aria-multiline="true"
        contentEditable={!disabled}
        suppressContentEditableWarning
        onInput={() => { emitChange(); detectTrigger() }}
        onKeyUp={detectTrigger}
        onClick={detectTrigger}
        onKeyDown={handleKeyDown}
        onBlur={() => { setTimeout(() => setOpen(false), 150) }}
        data-placeholder={placeholder}
        style={{ minHeight: `${rows * 1.5 + 1}rem` }}
        className={cn(
          'flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'empty:before:text-muted-foreground empty:before:content-[attr(data-placeholder)]',
          'whitespace-pre-wrap break-words',
          className,
        )}
      />
      {open && (
        <div className="absolute left-0 right-0 z-50 mt-1 max-h-56 overflow-y-auto rounded-md border bg-popover shadow-md">
          {loading ? (
            <div className="flex items-center justify-center py-3 text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Buscando…
            </div>
          ) : options.length === 0 ? (
            <p className="py-3 text-center text-sm text-muted-foreground">Sin usuarios</p>
          ) : (
            options.map((o, i) => (
              <button
                key={o.id}
                type="button"
                // onMouseDown (not onClick) so it fires before the editor's onBlur.
                onMouseDown={(e) => { e.preventDefault(); insertMention(o) }}
                className={cn(
                  'flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-accent',
                  i === activeIdx && 'bg-accent',
                )}
              >
                <span className="font-medium">{o.name}</span>
                <span className="ml-2 truncate text-xs text-muted-foreground">{o.email}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
