import Link from 'next/link'
import { Download, MoreVertical, Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { contactFiltersSchema, SOURCES } from '@/lib/contacts/schemas'
import { listContacts } from '@/lib/contacts/queries'
import { listSavedViewsForEntity } from '@/lib/saved-views/queries'

import { ContactsTable } from './_components/contacts-table'
import { ContactsFilters } from './_components/contacts-filters'
import { ContactsPagination } from './_components/contacts-pagination'
import { ContactsSmartTabs } from './_components/contacts-smart-tabs'
import { SaveSmartListDialog } from './_components/save-smart-list-dialog'

export const metadata = { title: 'Contacts · Autopilot' }

interface PageProps {
  searchParams: Record<string, string | string[] | undefined>
}

export default async function ContactsPage({ searchParams }: PageProps) {
  const user = await requireAuth()
  if (!user.workspaceId) {
    return (
      <div className="p-8 text-sm text-muted-foreground">
        Selecciona un workspace para ver contactos.
      </div>
    )
  }

  const parsed = contactFiltersSchema.safeParse(searchParams)
  const filters = parsed.success ? parsed.data : contactFiltersSchema.parse({})

  const [{ items, total, page, pageSize }, agents, tags, savedViews] = await Promise.all([
    listContacts({
      workspaceId: user.workspaceId,
      role: user.role,
      userId: user.id,
      filters,
    }),
    db.user.findMany({
      where: {
        workspaceId: user.workspaceId,
        role: { in: ['ADMIN', 'ASESOR'] },
        isActive: true,
      },
      select: { id: true, firstName: true, lastName: true },
      orderBy: [{ firstName: 'asc' }],
    }),
    db.tag.findMany({
      where: { workspaceId: user.workspaceId },
      select: { id: true, name: true, color: true },
      orderBy: { name: 'asc' },
    }),
    listSavedViewsForEntity(user.workspaceId, user.id, 'contact'),
  ])

  const canShare = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN'
  const timezone = user.workspace?.timezone ?? 'America/Santo_Domingo'

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-3">
          <h1 className="text-2xl font-bold tracking-tight">Contacts</h1>
          <span className="rounded-md bg-primary/10 px-2 py-0.5 text-sm font-medium text-primary">
            {total.toLocaleString('en-US')} Contacts
          </span>
        </div>

        <div className="flex items-center gap-2">
          <SaveSmartListDialog canShare={canShare} />
          <Button variant="outline" size="sm" disabled title="En construcción (B.1.8)">
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Import
          </Button>
          <Button asChild size="sm">
            <Link href="/crm/contactos/nuevo">
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Add Contact
            </Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Más acciones">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem disabled>Exportar lista (1B.7)</DropdownMenuItem>
              <DropdownMenuItem disabled>Configurar vista (1B.7)</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <ContactsSmartTabs views={savedViews} currentUserId={user.id} />

      <ContactsFilters
        initial={filters}
        agents={agents}
        tags={tags}
        sources={[...SOURCES]}
      />

      <ContactsTable items={items} timezone={timezone} />

      <ContactsPagination total={total} page={page} pageSize={pageSize} />
    </div>
  )
}
