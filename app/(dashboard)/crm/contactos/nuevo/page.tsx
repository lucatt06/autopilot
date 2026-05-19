import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import { ContactForm } from './contact-form'

export const metadata = { title: 'Nuevo contacto · Autopilot' }

export default function NewContactPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="icon">
          <Link href="/crm/contactos" aria-label="Volver">
            <ChevronLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Nuevo contacto</h1>
          <p className="text-sm text-muted-foreground">
            Los datos mínimos son nombre y apellido. El resto puedes completarlo después.
          </p>
        </div>
      </div>

      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle className="text-base">Datos del contacto</CardTitle>
        </CardHeader>
        <CardContent>
          <ContactForm />
        </CardContent>
      </Card>
    </div>
  )
}
