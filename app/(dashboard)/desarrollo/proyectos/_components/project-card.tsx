'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { Building2, MapPin, MoreVertical } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { deleteProject } from '@/app/actions/projects'
import { STATUS_LABELS, STATUS_BADGE, TYPE_LABELS } from '@/lib/projects/schemas'
import { cn } from '@/lib/utils'

interface ProjectCardData {
  id: string
  name: string
  type: keyof typeof TYPE_LABELS
  location: string | null
  status: keyof typeof STATUS_LABELS
  progressPercent: number
  coverImage: string | null
  buildingsCount: number
  unitsCount: number
  soldUnits: number
  salesProgress: number
}

export function ProjectCard({
  project,
  canManage,
}: {
  project: ProjectCardData
  canManage: boolean
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function onDelete() {
    if (!confirm(`¿Eliminar el proyecto "${project.name}"?`)) return
    startTransition(async () => {
      const result = await deleteProject(project.id)
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      toast.success('Proyecto eliminado')
      router.refresh()
    })
  }

  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border bg-card transition-all hover:border-primary/30 hover:shadow-md">
      <Link href={`/desarrollo/proyectos/${project.id}`} className="block">
        <div className="relative aspect-[16/10] overflow-hidden bg-muted">
          {project.coverImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={project.coverImage}
              alt={project.name}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Building2 className="h-12 w-12 text-muted-foreground/30" />
            </div>
          )}
          <span
            className={cn(
              'absolute left-2 top-2 inline-flex rounded-md border px-2 py-0.5 text-[11px] font-medium',
              STATUS_BADGE[project.status]
            )}
          >
            {STATUS_LABELS[project.status]}
          </span>
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <Link href={`/desarrollo/proyectos/${project.id}`} className="min-w-0 flex-1">
            <h3 className="truncate font-semibold leading-tight group-hover:text-primary">
              {project.name}
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {TYPE_LABELS[project.type]}
            </p>
          </Link>
          {canManage && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Acciones">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/desarrollo/proyectos/${project.id}`}>Ver detalles</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/desarrollo/proyectos/${project.id}/editar`}>Editar</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={onDelete}
                  disabled={isPending}
                  className="text-destructive focus:text-destructive"
                >
                  Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {project.location && (
          <p className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            <span className="truncate">{project.location}</span>
          </p>
        )}

        <div className="mt-3 grid grid-cols-2 gap-2 text-center text-xs">
          <div className="rounded-md bg-muted/50 px-2 py-1.5">
            <div className="font-semibold text-foreground">{project.buildingsCount}</div>
            <div className="text-muted-foreground">Edificios</div>
          </div>
          <div className="rounded-md bg-muted/50 px-2 py-1.5">
            <div className="font-semibold text-foreground">{project.unitsCount}</div>
            <div className="text-muted-foreground">Unidades</div>
          </div>
        </div>

        <div className="mt-3 space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Ventas</span>
            <span className="font-medium">
              {project.soldUnits} / {project.unitsCount} · {project.salesProgress}%
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-emerald-500 transition-all"
              style={{ width: `${project.salesProgress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
