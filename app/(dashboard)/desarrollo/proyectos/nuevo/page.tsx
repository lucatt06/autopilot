import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { requireRole } from '@/lib/auth'

import { ProjectForm } from './project-form'

export const metadata = { title: 'Nuevo proyecto · Autopilot' }

export default async function NewProjectPage() {
  await requireRole('SUPER_ADMIN', 'ADMIN')

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="icon">
          <Link href="/desarrollo/proyectos" aria-label="Volver">
            <ChevronLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Nuevo proyecto</h1>
          <p className="text-sm text-muted-foreground">
            Solo el nombre es obligatorio. Lo demás puedes completarlo después.
          </p>
        </div>
      </div>

      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle className="text-base">Datos del proyecto</CardTitle>
        </CardHeader>
        <CardContent>
          <ProjectForm />
        </CardContent>
      </Card>
    </div>
  )
}
