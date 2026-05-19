import Link from 'next/link'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

import { LoginForm } from './login-form'

export const metadata = {
  title: 'Iniciar sesión · Autopilot',
}

export default function LoginPage({
  searchParams,
}: {
  searchParams: { redirectTo?: string; error?: string }
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Iniciar sesión</CardTitle>
        <CardDescription>Ingresa con tu cuenta corporativa</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <LoginForm redirectTo={searchParams.redirectTo} initialError={searchParams.error} />

        <Separator />

        <div className="text-center text-sm">
          <Link href="/forgot-password" className="text-primary hover:underline">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
