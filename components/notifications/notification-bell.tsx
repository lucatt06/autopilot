'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, CheckCheck, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { createBrowserClient } from '@/lib/supabase/client'
import {
  getNotifications,
  getUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationItem,
} from '@/app/actions/notifications'

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'ahora'
  if (m < 60) return `hace ${m} min`
  const h = Math.floor(m / 60)
  if (h < 24) return `hace ${h} h`
  const d = Math.floor(h / 24)
  if (d < 7) return `hace ${d} d`
  return new Date(iso).toLocaleDateString('es-DO', { day: '2-digit', month: 'short' })
}

export function NotificationBell({ userId }: { userId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<NotificationItem[]>([])
  const [unread, setUnread] = useState(0)
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    const [list, count] = await Promise.all([getNotifications({ limit: 50 }), getUnreadCount()])
    setItems(list)
    setUnread(count)
    setLoading(false)
  }, [])

  // Initial unread count.
  useEffect(() => {
    getUnreadCount().then(setUnread).catch(() => {})
  }, [])

  // Load the list when the panel opens.
  useEffect(() => {
    if (open) refresh()
  }, [open, refresh])

  // Supabase Realtime: new notifications for this user arrive live.
  useEffect(() => {
    const supabase = createBrowserClient()
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'Notification', filter: `userId=eq.${userId}` },
        (payload) => {
          const n = payload.new as Record<string, unknown>
          setUnread((c) => c + 1)
          setItems((prev) => [
            {
              id: String(n.id),
              type: String(n.type),
              title: String(n.title),
              body: (n.body as string | null) ?? null,
              link: (n.link as string | null) ?? null,
              isRead: false,
              entityType: (n.entityType as string | null) ?? null,
              entityId: (n.entityId as string | null) ?? null,
              createdAt: String(n.createdAt ?? new Date().toISOString()),
            },
            ...prev,
          ])
        },
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [userId])

  async function handleClick(n: NotificationItem) {
    if (!n.isRead) {
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)))
      setUnread((c) => Math.max(0, c - 1))
      await markNotificationRead(n.id)
    }
    setOpen(false)
    if (n.link) router.push(n.link)
  }

  async function handleMarkAll() {
    setItems((prev) => prev.map((x) => ({ ...x, isRead: true })))
    setUnread(0)
    await markAllNotificationsRead()
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="relative h-10 w-10"
        aria-label="Notificaciones"
        onClick={() => setOpen(true)}
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
          <SheetHeader className="flex-row items-center justify-between border-b px-4 py-3 text-left">
            <SheetTitle className="text-base">Notificaciones</SheetTitle>
            {unread > 0 && (
              <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs" onClick={handleMarkAll}>
                <CheckCheck className="h-3.5 w-3.5" /> Marcar todas
              </Button>
            )}
          </SheetHeader>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cargando…
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Bell className="h-10 w-10 text-muted-foreground/40" />
                <p className="mt-3 text-sm font-medium">Sin notificaciones</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Aquí verás las menciones y avisos.
                </p>
              </div>
            ) : (
              <ul className="divide-y">
                {items.map((n) => (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => handleClick(n)}
                      className={cn(
                        'flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-accent',
                        !n.isRead && 'bg-primary/5',
                      )}
                    >
                      <span
                        className={cn(
                          'mt-1.5 h-2 w-2 shrink-0 rounded-full',
                          n.isRead ? 'bg-transparent' : 'bg-primary',
                        )}
                        aria-hidden
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium leading-snug">{n.title}</span>
                        {n.body && (
                          <span className="mt-0.5 line-clamp-2 block text-xs text-muted-foreground">
                            {n.body}
                          </span>
                        )}
                        <span className="mt-1 block text-[11px] text-muted-foreground">
                          {relativeTime(n.createdAt)}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
