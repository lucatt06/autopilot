'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { Icon } from '@/components/icons'
import { cn } from '@/lib/utils'
import type { NavSection } from '@/lib/navigation'

interface SidebarProps {
  sections: NavSection[]
  title?: string
  /** When provided, items prefixed with this href become "active candidates" */
  basePath?: string
  /** Optional extra content rendered right below the title (e.g. selectors). */
  headerExtra?: React.ReactNode
}

export function Sidebar({ sections, title, basePath, headerExtra }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="w-64 shrink-0 overflow-y-auto border-r bg-muted/20">
      {(title || headerExtra) && (
        <div className="space-y-3 border-b px-4 py-4">
          {title && (
            <h2 className="text-center text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {title}
            </h2>
          )}
          {headerExtra}
        </div>
      )}

      <nav className="flex flex-col gap-1 p-3">
        {sections.map((section, sIdx) => (
          <div key={sIdx} className="mb-2">
            {section.label && (
              <>
                <div className="mb-1 px-3 pt-3 text-xs font-medium uppercase tracking-wide text-muted-foreground/70">
                  {section.label}
                </div>
                <div className="mx-3 mb-2 border-t" />
              </>
            )}

            <ul className="flex flex-col gap-0.5">
              {section.items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== basePath && pathname.startsWith(`${item.href}/`))

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        'flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors',
                        isActive
                          ? 'bg-primary/10 font-medium text-primary'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      )}
                    >
                      <Icon name={item.icon} className="h-4 w-4 shrink-0" />
                      <span className="flex-1 truncate">{item.label}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  )
}
