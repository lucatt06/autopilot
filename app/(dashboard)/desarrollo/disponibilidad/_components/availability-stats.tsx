const usd = (n: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n)

interface StatCard {
  key: string
  label: string
  labelClass: string
}

const CARDS: StatCard[] = [
  { key: 'TOTAL', label: 'Total', labelClass: 'text-foreground' },
  { key: 'DISPONIBLE', label: 'Disponibles', labelClass: 'text-emerald-600' },
  { key: 'BLOQUEADA', label: 'Bloqueadas', labelClass: 'text-amber-600' },
  { key: 'RESERVADA', label: 'Reservadas', labelClass: 'text-blue-600' },
  { key: 'VENDIDA', label: 'Vendidas', labelClass: 'text-rose-600' },
  { key: 'ENTREGADA', label: 'Entregadas', labelClass: 'text-purple-600' },
]

interface Props {
  stats: Record<string, { count: number; value: number }>
}

export function AvailabilityStats({ stats }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {CARDS.map(({ key, label, labelClass }) => {
        const { count, value } = stats[key] ?? { count: 0, value: 0 }
        return (
          <div key={key} className="rounded-lg border bg-card p-4">
            <p className={`text-sm font-medium ${labelClass}`}>{label}</p>
            <p className="mt-1 text-3xl font-bold tabular-nums">{count.toLocaleString('en-US')}</p>
            <p className="text-sm text-muted-foreground">{usd(value)}</p>
          </div>
        )
      })}
    </div>
  )
}
