'use client'

import { useState } from 'react'
import { Download, FileText } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import type { BuildingForAvailability, UnitForAvailability } from '@/lib/buildings/queries'
import { UnitDetailSheet } from './unit-detail-sheet'

const STATUS_CONFIG: Record<string, { label: string; cell: string; dot: string }> = {
  DISPONIBLE: {
    label: 'Disponible',
    cell: 'bg-green-100 border-green-300 text-green-800 hover:bg-green-200',
    dot: 'bg-green-500',
  },
  BLOQUEADA: {
    label: 'Bloqueada',
    cell: 'bg-amber-100 border-amber-300 text-amber-800 hover:bg-amber-200',
    dot: 'bg-amber-500',
  },
  RESERVADA: {
    label: 'Reservada',
    cell: 'bg-blue-100 border-blue-300 text-blue-800 hover:bg-blue-200',
    dot: 'bg-blue-500',
  },
  VENDIDA: {
    label: 'Vendida',
    cell: 'bg-red-100 border-red-300 text-red-800 hover:bg-red-200',
    dot: 'bg-red-500',
  },
  ENTREGADA: {
    label: 'Entregada',
    cell: 'bg-purple-100 border-purple-300 text-purple-800 hover:bg-purple-200',
    dot: 'bg-purple-500',
  },
}

function formatPrice(n: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n)
}

function exportCsv(buildings: BuildingForAvailability[]) {
  const header = ['Edificio', 'Piso', 'Unidad', 'Tipo', 'Hab', 'Baños', 'm²', 'Precio', 'Estado']
  const rows: string[][] = [header]

  for (const b of buildings) {
    for (const f of b.floors) {
      for (const u of f.units) {
        rows.push([
          b.name,
          String(u.floor),
          u.unitNumber,
          u.type,
          String(u.bedrooms),
          String(u.bathrooms),
          String(u.squareMeters),
          formatPrice(u.currentPrice),
          STATUS_CONFIG[u.status]?.label ?? u.status,
        ])
      }
    }
  }

  const csv = rows.map((r) => r.map((v) => `"${v.replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'disponibilidad.csv'
  a.click()
  URL.revokeObjectURL(url)
}

interface Props {
  buildings: BuildingForAvailability[]
}

export function AvailabilityMap({ buildings }: Props) {
  const [selectedUnit, setSelectedUnit] = useState<UnitForAvailability | null>(null)
  const [selectedBuildingName, setSelectedBuildingName] = useState('')

  if (buildings.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-12 text-center">
        <p className="text-sm text-muted-foreground">
          No hay edificios con unidades para los proyectos seleccionados.
        </p>
      </div>
    )
  }

  return (
    <>
      {/* Export toolbar */}
      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" size="sm" onClick={() => exportCsv(buildings)}>
          <Download className="h-4 w-4" />
          Exportar CSV
        </Button>
        <Button variant="outline" size="sm" onClick={() => window.print()}>
          <FileText className="h-4 w-4" />
          Exportar PDF
        </Button>
      </div>

      {/* Building tabs */}
      <Tabs defaultValue={buildings[0]!.id}>
        <TabsList className="flex-wrap h-auto gap-1 mb-2">
          {buildings.map((b) => (
            <TabsTrigger key={b.id} value={b.id} className="text-xs">
              {b.project.name} — {b.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {buildings.map((b) => (
          <TabsContent key={b.id} value={b.id}>
            <div className="rounded-lg border bg-card p-4 space-y-4">
              {/* Stats row */}
              <div className="flex flex-wrap items-center gap-4 text-sm">
                {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                  <span key={key} className="flex items-center gap-1.5">
                    <span className={cn('h-2.5 w-2.5 rounded-full', cfg.dot)} />
                    <span className="text-muted-foreground">{cfg.label}:</span>
                    <span className="font-medium">{b.stats[key] !== undefined ? b.stats[key] : 0}</span>
                  </span>
                ))}
                <span className="ml-auto text-muted-foreground">
                  Total: <span className="font-medium text-foreground">{b.stats.total ?? 0}</span>
                </span>
              </div>

              {/* Floor grid */}
              <div className="space-y-1.5 overflow-x-auto">
                {b.floors.map((f) => (
                  <div key={f.floor} className="flex items-center gap-2">
                    <span className="w-14 shrink-0 text-right text-xs text-muted-foreground">
                      Piso {f.floor}
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {f.units.map((u) => {
                        const cfg = STATUS_CONFIG[u.status]
                        return (
                          <button
                            key={u.id}
                            onClick={() => {
                              setSelectedUnit(u)
                              setSelectedBuildingName(b.name)
                            }}
                            className={cn(
                              'h-9 min-w-[3.5rem] rounded border px-2 text-xs font-medium transition-colors',
                              cfg?.cell ?? 'bg-gray-100 border-gray-300 text-gray-800 hover:bg-gray-200',
                            )}
                          >
                            {u.unitNumber}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-3 pt-2 border-t text-xs text-muted-foreground">
                {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                  <span key={key} className="flex items-center gap-1.5">
                    <span
                      className={cn(
                        'inline-block h-3 w-5 rounded border',
                        cfg.cell.split(' ').slice(0, 2).join(' '),
                      )}
                    />
                    {cfg.label}
                  </span>
                ))}
              </div>
            </div>
          </TabsContent>
        ))}
      </Tabs>

      <UnitDetailSheet
        unit={selectedUnit}
        buildingName={selectedBuildingName}
        onClose={() => setSelectedUnit(null)}
      />
    </>
  )
}
