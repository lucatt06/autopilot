import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { notFound } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StubPage } from '@/components/stub-page'
import { requireAuth } from '@/lib/auth'
import { getContactById } from '@/lib/contacts/queries'

export const metadata = { title: 'Contacto · Autopilot' }

interface PageProps {
  params: { id: string }
}

export default async function ContactDetailPage({ params }: PageProps) {
  const user = await requireAuth()
  if (!user.workspaceId) return notFound()

  const contact = await getContactById(params.id, user.workspaceId, user.role, user.id)
  if (!contact) return notFound()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="icon">
          <Link href="/crm/contactos" aria-label="Volver">
            <ChevronLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {contact.firstName} {contact.lastName}
          </h1>
          <p className="text-sm text-muted-foreground">
            {contact.email ?? contact.mobilePhone ?? '—'}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Resumen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div>
            <span className="font-medium">Tipo:</span> {contact.contactType}
          </div>
          <div>
            <span className="font-medium">Temperatura:</span> {contact.temperature}
          </div>
          <div>
            <span className="font-medium">Owner:</span>{' '}
            {contact.owner
              ? `${contact.owner.firstName} ${contact.owner.lastName}`
              : 'Sin asignar'}
          </div>
          <div>
            <span className="font-medium">Empresa:</span> {contact.company ?? '—'}
          </div>
          <div>
            <span className="font-medium">Ciudad:</span> {contact.city ?? '—'}
          </div>
          <div>
            <span className="font-medium">Fuente:</span> {contact.source ?? '—'}
          </div>
        </CardContent>
      </Card>

      <StubPage
        title="Vista detalle completa"
        phase="1B.4-1B.6"
        description="Aquí va la vista de 3 paneles + 7 tabs. Por ahora solo el resumen básico."
      />
    </div>
  )
}
