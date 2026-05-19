'use client'

import { useState, useTransition } from 'react'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { requestPasswordReset } from '@/app/actions/auth'

export function ForgotPasswordForm() {
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const [isPending, startTransition] = useTransition()

  async function onSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await requestPasswordReset(formData)
      if (!result.ok) setError(result.error)
      else setSent(true)
    })
  }

  if (sent) {
    return (
      <Alert>
        <AlertDescription>
          Si el email existe, recibirás un enlace para restablecer tu contraseña en los próximos
          minutos. Revisa también tu carpeta de spam.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <form action={onSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="tu@empresa.com"
          disabled={isPending}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? 'Enviando...' : 'Enviar enlace'}
      </Button>
    </form>
  )
}
