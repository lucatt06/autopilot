'use client'

import Link from 'next/link'
import { Mail, MessageSquare, Phone, Users } from 'lucide-react'

import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ContactAvatar } from '@/components/contact-avatar'
import { ContactTagsCell } from './contact-tags-cell'
import { formatRelative, formatDateTime } from '@/lib/dates'

interface ContactItem {
  id: string
  firstName: string
  lastName: string
  email: string | null
  mobilePhone: string | null
  phone: string | null
  // Date objects from server become ISO strings after serialization
  createdAt: Date | string
  lastActivityAt: Date | string | null
  lastChannelUsed: string | null
  tags: { tag: { id: string; name: string; color: string } }[]
}

const CHANNEL_ICON: Record<string, typeof MessageSquare> = {
  WHATSAPP_META: MessageSquare,
  WHATSAPP_EVOLUTION: MessageSquare,
  SMS: MessageSquare,
  EMAIL: Mail,
}

export function ContactsTable({
  items,
  timezone = 'America/Santo_Domingo',
}: {
  items: ContactItem[]
  timezone?: string
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-lg border bg-card py-16 text-center">
        <Users className="mx-auto h-10 w-10 text-muted-foreground" />
        <h3 className="mt-3 text-sm font-medium">Sin contactos aún</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Crea tu primer contacto desde el botón &ldquo;+ Add Contact&rdquo;.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-10">
              <Checkbox aria-label="Seleccionar todos" />
            </TableHead>
            <TableHead className="font-medium">Contact name</TableHead>
            <TableHead className="font-medium">Phone</TableHead>
            <TableHead className="font-medium">Email</TableHead>
            <TableHead className="font-medium">Created (AST)</TableHead>
            <TableHead className="font-medium">Last activity (AST)</TableHead>
            <TableHead className="font-medium">Tags</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((c) => {
            const phone = c.mobilePhone ?? c.phone
            const ChannelIcon = c.lastChannelUsed
              ? (CHANNEL_ICON[c.lastChannelUsed] ?? MessageSquare)
              : MessageSquare
            return (
              <TableRow key={c.id} className="group">
                <TableCell>
                  <Checkbox aria-label={`Seleccionar ${c.firstName} ${c.lastName}`} />
                </TableCell>

                <TableCell>
                  <Link
                    href={`/crm/contactos/${c.id}`}
                    className="flex items-center gap-2.5 group-hover:text-primary"
                  >
                    <ContactAvatar firstName={c.firstName} lastName={c.lastName} />
                    <span className="font-medium">
                      {c.firstName} {c.lastName}
                    </span>
                  </Link>
                </TableCell>

                <TableCell>
                  {phone ? (
                    <span className="inline-flex items-center gap-1.5 text-sm">
                      <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                      {phone}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>

                <TableCell>
                  {c.email ? (
                    <a
                      href={`mailto:${c.email}`}
                      className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                    >
                      <Mail className="h-3.5 w-3.5" />
                      {c.email}
                    </a>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>

                <TableCell className="text-sm">
                  {formatDateTime(c.createdAt, timezone)}
                </TableCell>

                <TableCell className="text-sm">
                  {c.lastActivityAt ? (
                    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                      <ChannelIcon className="h-3.5 w-3.5" />
                      {formatRelative(c.lastActivityAt)}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>

                <TableCell>
                  <ContactTagsCell tags={c.tags.map((t) => t.tag)} />
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
