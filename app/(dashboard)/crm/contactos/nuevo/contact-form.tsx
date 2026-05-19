'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createContact } from '@/app/actions/contacts'

export function ContactForm() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [contactType, setContactType] = useState<string>('LEAD')
  const [temperature, setTemperature] = useState<string>('SIN_CLASIFICAR')

  function onSubmit(formData: FormData) {
    setError(null)

    const input = {
      firstName: String(formData.get('firstName') ?? '').trim(),
      lastName: String(formData.get('lastName') ?? '').trim(),
      email: String(formData.get('email') ?? '').trim() || undefined,
      mobilePhone: String(formData.get('mobilePhone') ?? '').trim() || undefined,
      phone: String(formData.get('phone') ?? '').trim() || undefined,
      city: String(formData.get('city') ?? '').trim() || undefined,
      country: String(formData.get('country') ?? '').trim() || undefined,
      company: String(formData.get('company') ?? '').trim() || undefined,
      position: String(formData.get('position') ?? '').trim() || undefined,
      source: String(formData.get('source') ?? '').trim() || undefined,
      contactType,
      temperature,
    }

    startTransition(async () => {
      const result = await createContact(input as never)
      if (!result.ok) {
        setError(result.error)
        return
      }
      toast.success('Contacto creado')
      if (result.data?.id) {
        router.push(`/crm/contactos/${result.data.id}`)
      } else {
        router.push('/crm/contactos')
      }
    })
  }

  return (
    <form action={onSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Información Personal */}
      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-muted-foreground">
          Información Personal
        </legend>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="firstName">Nombre *</Label>
            <Input id="firstName" name="firstName" required disabled={isPending} autoFocus />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Apellido *</Label>
            <Input id="lastName" name="lastName" required disabled={isPending} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" disabled={isPending} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mobilePhone">Celular</Label>
            <Input id="mobilePhone" name="mobilePhone" type="tel" disabled={isPending} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="phone">Teléfono</Label>
            <Input id="phone" name="phone" type="tel" disabled={isPending} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label htmlFor="city">Ciudad</Label>
              <Input id="city" name="city" disabled={isPending} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">País</Label>
              <Input id="country" name="country" disabled={isPending} />
            </div>
          </div>
        </div>
      </fieldset>

      {/* Profesional */}
      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-muted-foreground">
          Información Profesional
        </legend>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="company">Empresa</Label>
            <Input id="company" name="company" disabled={isPending} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="position">Cargo</Label>
            <Input id="position" name="position" disabled={isPending} />
          </div>
        </div>
      </fieldset>

      {/* Clasificación */}
      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-muted-foreground">
          Clasificación del Lead
        </legend>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="contactType">Tipo de contacto *</Label>
            <Select value={contactType} onValueChange={setContactType}>
              <SelectTrigger id="contactType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LEAD">Lead</SelectItem>
                <SelectItem value="PROSPECTO">Prospecto</SelectItem>
                <SelectItem value="CLIENTE">Cliente</SelectItem>
                <SelectItem value="AGENTE_INMOBILIARIO">Agente Inmobiliario</SelectItem>
                <SelectItem value="REFERIDO">Referido</SelectItem>
                <SelectItem value="OTRO">Otro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="temperature">Temperatura</Label>
            <Select value={temperature} onValueChange={setTemperature}>
              <SelectTrigger id="temperature">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MUY_CALIENTE">Muy caliente</SelectItem>
                <SelectItem value="CALIENTE">Caliente</SelectItem>
                <SelectItem value="TIBIO">Tibio</SelectItem>
                <SelectItem value="FRIO">Frío</SelectItem>
                <SelectItem value="SIN_CLASIFICAR">Sin clasificar</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="source">Fuente</Label>
          <Input
            id="source"
            name="source"
            placeholder="Facebook, Instagram, Página web..."
            disabled={isPending}
          />
        </div>
      </fieldset>

      <div className="flex items-center justify-end gap-2 border-t pt-4">
        <Button asChild variant="outline" disabled={isPending}>
          <a href="/crm/contactos">Cancelar</a>
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Guardando...' : 'Crear contacto'}
        </Button>
      </div>
    </form>
  )
}
