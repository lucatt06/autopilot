'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'
import { List, Share2, X } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { deleteSavedView } from '@/app/actions/saved-views'

interface SavedView {
  id: string
  name: string
  filters: Record<string, unknown>
  isShared: boolean
  userId: string
}

const NON_FILTER_PARAMS = new Set(['page', 'list'])

function paramsEqual(a: Record<string, unknown>, b: URLSearchParams): boolean {
  const aKeys = Object.keys(a).filter((k) => !NON_FILTER_PARAMS.has(k))
  const bKeys: string[] = []
  for (const k of b.keys()) if (!NON_FILTER_PARAMS.has(k)) bKeys.push(k)
  if (aKeys.length !== bKeys.length) return false
  for (const k of aKeys) {
    if (String(a[k] ?? '') !== (b.get(k) ?? '')) return false
  }
  return true
}

export function ContactsSmartTabs({
  views,
  currentUserId,
}: {
  views: SavedView[]
  currentUserId: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  // Are there any active filter params? If none, "All" is the active tab.
  const hasFilters = Array.from(searchParams.keys()).some(
    (k) => !NON_FILTER_PARAMS.has(k)
  )
  const allActive = !hasFilters

  function applyView(view: SavedView) {
    const params = new URLSearchParams()
    for (const [k, v] of Object.entries(view.filters)) {
      if (v === null || v === undefined || v === '') continue
      params.set(k, String(v))
    }
    startTransition(() => router.replace(`?${params.toString()}`))
  }

  async function onDelete(view: SavedView) {
    if (!confirm(`¿Eliminar la Smart List "${view.name}"?`)) return
    const result = await deleteSavedView(view.id)
    if (!result.ok) {
      toast.error(result.error)
      return
    }
    toast.success('Smart list eliminada')
    router.refresh()
  }

  return (
    <TooltipProvider delayDuration={400}>
      <div className="flex items-center gap-1 overflow-x-auto border-b">
        <Link
          href="/crm/contactos"
          className={cn(
            'flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2 text-sm transition-colors',
            allActive
              ? 'border-primary text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          <List className="h-3.5 w-3.5" />
          All
        </Link>

        {views.map((v) => {
          const isActive = !allActive && paramsEqual(v.filters, searchParams)
          const isMine = v.userId === currentUserId
          return (
            <div key={v.id} className="group/tab relative shrink-0">
              <button
                type="button"
                onClick={() => applyView(v)}
                className={cn(
                  'flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm transition-colors',
                  isActive
                    ? 'border-primary text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                )}
              >
                {v.isShared && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Share2 className="h-3 w-3 text-emerald-600" />
                    </TooltipTrigger>
                    <TooltipContent>Compartida con el equipo</TooltipContent>
                  </Tooltip>
                )}
                <span className="max-w-[14rem] truncate">{v.name}</span>
              </button>
              {isMine && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete(v)
                  }}
                  className="absolute right-1 top-1.5 hidden h-4 w-4 items-center justify-center rounded-sm text-muted-foreground hover:bg-muted hover:text-destructive group-hover/tab:flex"
                  aria-label={`Eliminar ${v.name}`}
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          )
        })}

        <span className="ml-auto" />
      </div>
    </TooltipProvider>
  )
}
