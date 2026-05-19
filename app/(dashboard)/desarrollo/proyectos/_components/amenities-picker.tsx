'use client'

import { useState } from 'react'
import { Check, Plus, X } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { AMENITIES_CATALOG } from '@/lib/projects/schemas'

/**
 * Multi-select de amenidades / "Características" del proyecto.
 *
 * - Catálogo predefinido + custom free-form
 * - Internal state mantenido en un input hidden multi-value
 *   (name="amenities", FormData.getAll('amenities')).
 */
export function AmenitiesPicker({
  initial = [],
  name = 'amenities',
}: {
  initial?: string[]
  name?: string
}) {
  const [selected, setSelected] = useState<string[]>(initial)
  const [custom, setCustom] = useState('')

  const known = new Set<string>(AMENITIES_CATALOG as readonly string[])
  // Custom additions = whatever is in `selected` but not in catalog
  const customExtras = selected.filter((s) => !known.has(s))

  function toggle(name: string) {
    setSelected((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    )
  }

  function addCustom() {
    const v = custom.trim()
    if (!v) return
    if (selected.includes(v)) {
      setCustom('')
      return
    }
    setSelected((prev) => [...prev, v])
    setCustom('')
  }

  return (
    <div className="space-y-3">
      {/* Hidden inputs for form submit */}
      {selected.map((a) => (
        <input key={a} type="hidden" name={name} value={a} />
      ))}

      <div className="grid grid-cols-2 gap-1.5 md:grid-cols-3">
        {AMENITIES_CATALOG.map((a) => {
          const active = selected.includes(a)
          return (
            <button
              key={a}
              type="button"
              onClick={() => toggle(a)}
              className={cn(
                'flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-left text-sm transition-colors',
                active
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                  : 'border-input hover:bg-muted'
              )}
            >
              <span
                className={cn(
                  'inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border',
                  active ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-input'
                )}
              >
                {active && <Check className="h-3 w-3" />}
              </span>
              <span className="truncate">{a}</span>
            </button>
          )
        })}
      </div>

      {customExtras.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Personalizadas:</p>
          <div className="flex flex-wrap gap-1.5">
            {customExtras.map((a) => (
              <span
                key={a}
                className="inline-flex items-center gap-1 rounded-md border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-xs text-emerald-800"
              >
                {a}
                <button
                  type="button"
                  onClick={() => toggle(a)}
                  className="rounded hover:bg-emerald-200"
                  aria-label={`Quitar ${a}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <Input
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              addCustom()
            }
          }}
          placeholder="Agregar amenidad personalizada"
          className="h-9 text-sm"
        />
        <button
          type="button"
          onClick={addCustom}
          disabled={!custom.trim()}
          className={cn(
            'inline-flex shrink-0 items-center gap-1 rounded-md border bg-background px-3 py-1.5 text-sm transition-colors',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'hover:bg-muted'
          )}
        >
          <Plus className="h-3.5 w-3.5" />
          Agregar
        </button>
      </div>
    </div>
  )
}
