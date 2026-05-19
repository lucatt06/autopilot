'use client'

import { useState, useTransition } from 'react'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updatePassword } from '@/app/actions/auth'

export function ResetPasswordForm() {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  async function onSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await updatePassword(formData)
      if (!result.ok) setError(result.error)
    })
  }

  return (
    <form action={onSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="password">Nueva contraseña</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          disabled={isPending}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          disabled={isPending}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? 'Guardando...' : 'Guardar contraseña'}
      </Button>
    </form>
  )
}
