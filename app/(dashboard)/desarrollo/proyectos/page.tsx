import Link from 'next/link'
import { Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { requireAuth } from '@/lib/auth'
import { listProjects } from '@/lib/projects/queries'
import { projectFiltersSchema } from '@/lib/projects/schemas'

import { ProjectCard } from './_components/project-card'
import { ProjectsFilters } from './_components/projects-filters'

export const metadata = { title: 'Proyectos · Autopilot' }

interface PageProps {
  searchParams: Record<string, string | string[] | undefined>
}

export default async function ProjectsPage({ searchParams }: PageProps) {
  const user = await requireAuth()
  if (!user.workspaceId) {
    return (
      <div className="p-8 text-sm text-muted-foreground">
        Selecciona un workspace para ver proyectos.
      </div>
    )
  }

  const canManage = user.role === 'SUPER_ADMIN' || user.role === 'ADMIN'
  const parsed = projectFiltersSchema.safeParse(searchParams)
  const filters = parsed.success ? parsed.data : projectFiltersSchema.parse({})

  const { items, total } = await listProjects({
    workspaceId: user.workspaceId,
    filters,
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-3">
          <h1 className="text-2xl font-bold tracking-tight">Proyectos</h1>
          <span className="rounded-md bg-primary/10 px-2 py-0.5 text-sm font-medium text-primary">
            {total.toLocaleString('en-US')} Proyectos
          </span>
        </div>
        {canManage && (
          <Button asChild size="sm">
            <Link href="/desarrollo/proyectos/nuevo">
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Nuevo proyecto
            </Link>
          </Button>
        )}
      </div>

      <ProjectsFilters initial={filters} />

      {items.length === 0 ? (
        <div className="rounded-lg border bg-card py-16 text-center">
          <h3 className="text-sm font-medium">Sin proyectos aún</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {canManage
              ? 'Crea tu primer proyecto desde el botón “Nuevo proyecto”.'
              : 'Aún no se han creado proyectos en este workspace.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((p) => (
            <ProjectCard key={p.id} project={p} canManage={canManage} />
          ))}
        </div>
      )}
    </div>
  )
}
