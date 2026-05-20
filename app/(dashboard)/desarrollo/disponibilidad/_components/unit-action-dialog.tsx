'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import { Check, ChevronsUpDown, Loader2, UserPlus, X } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PriceInput } from '@/components/ui/price-input'
import {
  searchWonContacts,
  createQuickContact,
  createBlock,
  createReservation,
  createSale,
} from '@/app/actions/unit-quick-actions'

// ─── Types ───────────────────────────────────────────────────────────────────

export type ActionType = 'block' | 'reserve' | 'sell'

export interface UnitActionTarget {
  id: string
  unitNumber: string
  type: string
  squareMeters: number
  currentPrice: number
  status: string
}

interface Props {
  unit: UnitActionTarget | null
  action: ActionType | null
  onClose: () => void
}

type ContactOption = {
  id: string
  firstName: string
  lastName: string
  mobilePhone: string | null
  email: string | null
}

const ACTION_LABELS: Record<ActionType, string> = {
  block: 'Bloquear unidad',
  reserve: 'Reservar unidad',
  sell: 'Registrar venta',
}

const BLOCK_REASONS = [
  { value: 'CLIENTE_EVALUANDO', label: 'Cliente evaluando' },
  { value: 'PENDIENTE_DOCUMENTOS', label: 'Pendiente de documentos' },
  { value: 'PENDIENTE_CREDITO', label: 'Pendiente aprobación de crédito' },
  { value: 'NEGOCIACION_PRECIO', label: 'Negociación de precio' },
  { value: 'OTRO', label: 'Otro' },
] as const

const DURATION_OPTIONS = [
  { value: '24h', label: '24 h' },
  { value: '48h', label: '48 h' },
  { value: '72h', label: '72 h' },
  { value: '1w', label: '1 semana' },
  { value: '2w', label: '2 semanas' },
] as const

const usd = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

// ─── Contact Combobox ─────────────────────────────────────────────────────────

function ContactCombobox({
  value,
  onChange,
  required,
}: {
  value: ContactOption | null
  onChange: (c: ContactOption | null) => void
  required?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [options, setOptions] = useState<ContactOption[]>([])
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      const results = await searchWonContacts(query)
      setOptions(results)
      setLoading(false)
    }, 250)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  function select(c: ContactOption) {
    onChange(c)
    setOpen(false)
    setQuery('')
  }

  function clear(e: React.MouseEvent) {
    e.stopPropagation()
    onChange(null)
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        {value ? (
          <span className="flex items-center gap-2 truncate">
            <span className="font-medium">{value.firstName} {value.lastName}</span>
            {value.mobilePhone && (
              <span className="text-muted-foreground">{value.mobilePhone}</span>
            )}
          </span>
        ) : (
          <span className="text-muted-foreground">Buscar cliente ganado…</span>
        )}
        <span className="flex items-center gap-1 shrink-0">
          {value && (
            <X
              className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground"
              onClick={clear}
            />
          )}
          <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
        </span>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md">
          <div className="p-2 border-b">
            <Input
              autoFocus
              placeholder="Nombre, teléfono o email…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <div className="max-h-52 overflow-y-auto py-1">
            {loading ? (
              <div className="flex items-center justify-center py-4 text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Buscando…
              </div>
            ) : options.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                Sin resultados
              </p>
            ) : (
              options.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => select(c)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent"
                >
                  {value?.id === c.id && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                  {value?.id !== c.id && <span className="w-3.5 shrink-0" />}
                  <span className="font-medium">{c.firstName} {c.lastName}</span>
                  <span className="text-muted-foreground truncate">
                    {c.mobilePhone ?? c.email ?? ''}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── New Client Mini-Form ─────────────────────────────────────────────────────

function NewClientForm({
  onCreated,
  onCancel,
}: {
  onCreated: (c: ContactOption) => void
  onCancel: () => void
}) {
  const [isPending, startTransition] = useTransition()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [mobilePhone, setMobilePhone] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const result = await createQuickContact({ firstName, lastName, mobilePhone, email })
      if (!result.ok) {
        setError(result.error)
        return
      }
      onCreated({
        id: result.data!.id,
        firstName,
        lastName,
        mobilePhone: mobilePhone || null,
        email: email || null,
      })
    })
  }

  return (
    <form onSubmit={submit} className="rounded-md border bg-muted/30 p-3 space-y-3">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Nuevo cliente</p>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Nombre *</Label>
          <Input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
            className="h-8 text-sm"
            placeholder="Juan"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Apellido *</Label>
          <Input
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
            className="h-8 text-sm"
            placeholder="Pérez"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Teléfono</Label>
          <Input
            value={mobilePhone}
            onChange={(e) => setMobilePhone(e.target.value)}
            className="h-8 text-sm"
            placeholder="809-000-0000"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Email</Label>
          <Input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            className="h-8 text-sm"
            placeholder="email@ejemplo.com"
          />
        </div>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending && <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />}
          Crear
        </Button>
      </div>
    </form>
  )
}

// ─── Main Dialog ──────────────────────────────────────────────────────────────

export function UnitActionDialog({ unit, action, onClose }: Props) {
  const [isPending, startTransition] = useTransition()
  const [contact, setContact] = useState<ContactOption | null>(null)
  const [showNewClient, setShowNewClient] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Block fields
  const [reason, setReason] = useState<string>('CLIENTE_EVALUANDO')
  const [duration, setDuration] = useState<string>('48h')
  const [notes, setNotes] = useState('')

  // Reserve fields
  const [amount, setAmount] = useState<number | undefined>()
  const [expiresAt, setExpiresAt] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + 30)
    return d.toISOString().split('T')[0]!
  })

  // Sell fields
  const [finalPrice, setFinalPrice] = useState<number | undefined>(unit?.currentPrice)
  const [closeDate, setCloseDate] = useState(() => new Date().toISOString().split('T')[0]!)

  // Sync finalPrice when unit changes
  useEffect(() => {
    setFinalPrice(unit?.currentPrice)
    setContact(null)
    setShowNewClient(false)
    setError(null)
    setNotes('')
  }, [unit?.id, action])

  function handleClientCreated(c: ContactOption) {
    setContact(c)
    setShowNewClient(false)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!unit || !action) return
    setError(null)

    startTransition(async () => {
      let result

      if (action === 'block') {
        result = await createBlock({
          unitId: unit.id,
          contactId: contact?.id,
          reason: reason as never,
          duration: duration as never,
          notes,
        })
      } else if (action === 'reserve') {
        if (!contact) { setError('Selecciona un cliente'); return }
        if (!amount) { setError('Ingresa el monto de reserva'); return }
        result = await createReservation({
          unitId: unit.id,
          contactId: contact.id,
          amount,
          expiresAt: expiresAt!,
          notes,
        })
      } else {
        if (!contact) { setError('Selecciona un cliente'); return }
        if (!finalPrice) { setError('Ingresa el precio final'); return }
        result = await createSale({
          unitId: unit.id,
          contactId: contact.id,
          finalPrice,
          closeDate: closeDate!,
          notes,
        })
      }

      if (!result.ok) {
        setError(result.error)
        return
      }

      const labels: Record<ActionType, string> = {
        block: 'Unidad bloqueada',
        reserve: 'Reserva creada',
        sell: 'Venta registrada',
      }
      toast.success(labels[action])
      onClose()
    })
  }

  const isOpen = !!unit && !!action
  const clientRequired = action !== 'block'

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{action ? ACTION_LABELS[action] : ''}</DialogTitle>
        </DialogHeader>

        {unit && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Unit summary */}
            <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm flex items-center justify-between">
              <span className="font-semibold">{unit.unitNumber}</span>
              <span className="text-muted-foreground">{unit.type} · {unit.squareMeters} m²</span>
              <span className="font-medium tabular-nums">{usd(unit.currentPrice)}</span>
            </div>

            {/* Client selector */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>
                  Cliente{clientRequired ? ' *' : ''}
                  {!clientRequired && <span className="ml-1 text-muted-foreground font-normal">(opcional)</span>}
                </Label>
                {!showNewClient && !contact && (
                  <button
                    type="button"
                    onClick={() => setShowNewClient(true)}
                    className="flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <UserPlus className="h-3 w-3" />
                    Crear nuevo
                  </button>
                )}
              </div>

              {showNewClient ? (
                <NewClientForm
                  onCreated={handleClientCreated}
                  onCancel={() => setShowNewClient(false)}
                />
              ) : (
                <ContactCombobox value={contact} onChange={setContact} required={clientRequired} />
              )}
            </div>

            {/* Block-specific fields */}
            {action === 'block' && (
              <>
                <div className="space-y-2">
                  <Label>Motivo *</Label>
                  <Select value={reason} onValueChange={setReason}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BLOCK_REASONS.map((r) => (
                        <SelectItem key={r.value} value={r.value}>
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Duración *</Label>
                  <div className="flex gap-1.5 flex-wrap">
                    {DURATION_OPTIONS.map((d) => (
                      <button
                        key={d.value}
                        type="button"
                        onClick={() => setDuration(d.value)}
                        className={`rounded-md border px-3 py-1 text-sm transition-colors ${
                          duration === d.value
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-input hover:bg-accent'
                        }`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Reserve-specific fields */}
            {action === 'reserve' && (
              <>
                <div className="space-y-2">
                  <Label>Monto de reserva (USD) *</Label>
                  <PriceInput
                    value={amount}
                    onValueChange={setAmount}
                    placeholder="Ej. 5,000"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fecha de vencimiento *</Label>
                  <Input
                    type="date"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    required
                  />
                </div>
              </>
            )}

            {/* Sell-specific fields */}
            {action === 'sell' && (
              <>
                <div className="space-y-2">
                  <Label>Precio final de venta (USD) *</Label>
                  <PriceInput
                    value={finalPrice}
                    onValueChange={setFinalPrice}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fecha de cierre *</Label>
                  <Input
                    type="date"
                    value={closeDate}
                    onChange={(e) => setCloseDate(e.target.value)}
                    required
                  />
                </div>
              </>
            )}

            {/* Shared notes */}
            <div className="space-y-2">
              <Label>Notas <span className="text-muted-foreground font-normal">(opcional)</span></Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Observaciones internas…"
              />
            </div>

            {error && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {action === 'block' ? 'Bloquear' : action === 'reserve' ? 'Reservar' : 'Registrar venta'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
