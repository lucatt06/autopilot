import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { requireAuth } from '@/lib/auth'

export const metadata = {
  title: 'Dashboard · Autopilot',
}

export default async function DashboardHomePage() {
  const user = await requireAuth()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Hola, {user.firstName}
        </h1>
        <p className="text-muted-foreground">
          Bienvenido a Autopilot — Fase 1A · Bloque D (Auth)
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sesión activa</CardTitle>
          <CardDescription>Datos del usuario y workspace</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div>
            <span className="font-medium">User ID:</span>{' '}
            <code className="rounded bg-muted px-1.5 py-0.5">{user.id}</code>
          </div>
          <div>
            <span className="font-medium">Email:</span> {user.email}
          </div>
          <div>
            <span className="font-medium">Rol:</span> {user.role}
          </div>
          <div>
            <span className="font-medium">Workspace ID:</span>{' '}
            {user.workspaceId ? (
              <code className="rounded bg-muted px-1.5 py-0.5">{user.workspaceId}</code>
            ) : (
              <span className="text-muted-foreground">(Super Admin — sin workspace fijo)</span>
            )}
          </div>
          <div>
            <span className="font-medium">Workspace:</span>{' '}
            {user.workspace?.name ?? <span className="text-muted-foreground">—</span>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Próximos pasos</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <ul className="list-disc space-y-1 pl-5">
            <li>Bloque E — Layout principal estilo Odoo (menú visual de módulos)</li>
            <li>Bloque F — Seed inicial (Trinova + Super Admin Lucas) + validación final</li>
            <li>Fase 1B — CRM Core (Contactos, Pipelines, Negocios, Tareas, Citas)</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
