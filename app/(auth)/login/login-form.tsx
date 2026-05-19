'use client'

import { useState, useTransition } from 'react'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { signInWithEmail, signInWithGoogle } from '@/app/actions/auth'

const ERROR_MESSAGES: Record<string, string> = {
  account_inactive: 'Tu cuenta está desactivada. Contacta al administrador.',
  callback_error: 'No se pudo completar el inicio de sesión con Google.',
}

export function LoginForm({
  redirectTo: _redirectTo,
  initialError,
}: {
  redirectTo?: string
  initialError?: string
}) {
  const [error, setError] = useState<string | null>(
    initialError ? (ERROR_MESSAGES[initialError] ?? null) : null
  )
  const [isPending, startTransition] = useTransition()

  async function onSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await signInWithEmail(formData)
      if (!result.ok) setError(result.error)
    })
  }

  async function onGoogleClick() {
    setError(null)
    startTransition(async () => {
      const result = await signInWithGoogle()
      if (!result.ok) setError(result.error)
    })
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form action={onSubmit} className="space-y-4">
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

        <div className="space-y-2">
          <Label htmlFor="password">Contraseña</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            disabled={isPending}
          />
        </div>

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? 'Ingresando...' : 'Iniciar sesión'}
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">o</span>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={onGoogleClick}
        disabled={isPending}
      >
        Continuar con Google
      </Button>
    </div>
  )
}
