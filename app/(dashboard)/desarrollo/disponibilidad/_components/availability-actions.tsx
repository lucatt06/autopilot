'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'
import { Plus, Download, Link2, ExternalLink, Columns3, Check } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

export const TOGGLEABLE_COLUMNS = [
  { key: 'edificio', label: 'Edificio' },
  { key: 'etapa',    label: 'Etapa' },
  { key: 'entrega',  label: 'Entrega' },
  { key: 'piso',     label: 'Piso' },
  { key: 'tipo',     label: 'Tipo' },
  { key: 'm2',       label: 'M²' },
  { key: 'precio',   label: 'Precio' },
  { key: 'estado',   label: 'Estado' },
] as const

export type ColumnKey = (typeof TOGGLEABLE_COLUMNS)[number]['key']

export type ExportItem = {
  unitNumber: string
  building:   string
  etapa:      string
  entrega:    string
  piso:       number
  tipo:       string
  m2:         number
  precio:     number
  estado:     string
}

interface Props {
  canManage:   boolean
  exportItems: ExportItem[]
}

export function AvailabilityActions({ canManage, exportItems }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  const hiddenCols = (searchParams.get('hiddenCols') ?? '').split(',').filter(Boolean)

  function toggleColumn(key: string) {
    const params = new URLSearchParams(searchParams.toString())
    const current = (params.get('hiddenCols') ?? '').split(',').filter(Boolean)
    const next = current.includes(key)
      ? current.filter((k) => k !== key)
      : [...current, key]
    if (next.length === 0) params.delete('hiddenCols')
    else params.set('hiddenCols', next.join(','))
    startTransition(() => router.replace(`?${params.toString()}`))
  }

  function copyPublicLink() {
    navigator.clipboard.writeText(window.location.href)
    toast.success('Enlace copiado al portapapeles')
  }

  function openPublicView() {
    const params = new URLSearchParams(searchParams.toString())
    params.set('pub', '1')
    window.open(`${window.location.pathname}?${params.toString()}`, '_blank')
  }

  function exportExcel() {
    const headers = ['Unidad', 'Edificio', 'Etapa', 'Entrega', 'Piso', 'Tipo', 'M²', 'Precio', 'Estado']
    const rows = exportItems.map((i) => [
      i.unitNumber, i.building, i.etapa, i.entrega, i.piso, i.tipo,
      i.m2, i.precio, i.estado,
    ])
    const csv = [headers, ...rows]
      .map((row) => row.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'disponibilidad.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  function exportPdf() {
    window.print()
  }

  return (
    <div className="flex items-center gap-2">
      {canManage && (
        <Button asChild size="sm">
          <Link href={`/desarrollo/unidades/nuevo?${searchParams.toString()}`}>
            <Plus className="h-4 w-4" />
            Agregar
          </Link>
        </Button>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4" />
            Exportar
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={exportPdf}>
            Exportar PDF
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={exportExcel}>
            Exportar Excel
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Button variant="outline" size="sm" onClick={copyPublicLink}>
        <Link2 className="h-4 w-4" />
        Copiar enlace público
      </Button>

      <Button variant="outline" size="sm" onClick={openPublicView}>
        <ExternalLink className="h-4 w-4" />
        Ver público
      </Button>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(hiddenCols.length > 0 && 'border-primary text-primary')}
          >
            <Columns3 className="h-4 w-4" />
            Columnas
            {hiddenCols.length > 0 && (
              <span className="ml-1 rounded-full bg-primary px-1.5 text-[10px] font-medium text-primary-foreground">
                {TOGGLEABLE_COLUMNS.length - hiddenCols.length}/{TOGGLEABLE_COLUMNS.length}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-44 p-1" align="end">
          <div className="flex flex-col gap-0.5">
            {TOGGLEABLE_COLUMNS.map((col) => {
              const isVisible = !hiddenCols.includes(col.key)
              return (
                <button
                  key={col.key}
                  type="button"
                  onClick={() => toggleColumn(col.key)}
                  className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted"
                >
                  <div
                    className={cn(
                      'flex h-4 w-4 shrink-0 items-center justify-center rounded border',
                      isVisible
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-input',
                    )}
                  >
                    {isVisible && <Check className="h-3 w-3" />}
                  </div>
                  <span>{col.label}</span>
                </button>
              )
            })}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
