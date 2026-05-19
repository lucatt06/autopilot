import Link from 'next/link'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

import { ForgotPasswordForm } from './forgot-password-form'

export const metadata = {
  title: 'Recuperar contraseña · Autopilot',
}

export default function ForgotPasswordPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recuperar contraseña</CardTitle>
        <CardDescription>
          Te enviaremos un enlace para restablecer tu contraseña
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ForgotPasswordForm />
        <div className="text-center text-sm">
          <Link href="/login" className="text-primary hover:underline">
            Volver al inicio de sesión
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
