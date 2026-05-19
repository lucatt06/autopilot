import Link from 'next/link'

import { requireAuth } from '@/lib/auth'
import { getVisibleModules } from '@/lib/navigation'
import { cn } from '@/lib/utils'

export const metadata = {
  title: 'Inicio · Autopilot',
}

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Buenos días'
  if (hour < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

export default async function DashboardHomePage() {
  const user = await requireAuth()
  const modules = getVisibleModules(user.role, user.workspace?.enabledModules ?? [])

  return (
    <main className="container mx-auto max-w-5xl px-6 py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight">
          {getGreeting()}, {user.firstName}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {user.workspace?.name
            ? `${user.workspace.name} — selecciona un módulo para comenzar`
            : 'Super Admin — selecciona un módulo o entra a un workspace'}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {modules.map((m) => {
          const Icon = m.icon
          return (
            <Link
              key={m.key}
              href={m.href}
              className="group flex flex-col rounded-xl border bg-card p-6 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
            >
              <div
                className={cn(
                  'mb-4 flex h-12 w-12 items-center justify-center rounded-lg text-white shadow-sm',
                  m.color
                )}
              >
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold">{m.label}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{m.description}</p>
            </Link>
          )
        })}
      </div>
    </main>
  )
}
