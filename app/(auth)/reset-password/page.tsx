import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

import { ResetPasswordForm } from './reset-password-form'

export const metadata = {
  title: 'Nueva contraseña · Autopilot',
}

export default function ResetPasswordPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Establece tu nueva contraseña</CardTitle>
        <CardDescription>Mínimo 8 caracteres</CardDescription>
      </CardHeader>
      <CardContent>
        <ResetPasswordForm />
      </CardContent>
    </Card>
  )
}
