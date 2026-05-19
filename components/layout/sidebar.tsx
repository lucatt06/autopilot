'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { Badge } from '@/components/ui/badge'
import { Icon } from '@/components/icons'
import { cn } from '@/lib/utils'
import type { NavSection } from '@/lib/navigation'

interface SidebarProps {
  sections: NavSection[]
  title?: string
  /** When provided, items prefixed with this href become "active candidates" */
  basePath?: string
}

export function Sidebar({ sections, title, basePath }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="w-64 shrink-0 border-r bg-muted/20">
      {title && (
        <div className="border-b px-4 py-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {title}
          </h2>
        </div>
      )}

      <nav className="flex flex-col gap-1 p-3">
        {sections.map((section, sIdx) => (
          <div key={sIdx} className="mb-2">
            {section.label && (
              <div className="mb-1 px-3 pt-3 text-xs font-medium uppercase tracking-wide text-muted-foreground/70">
                {section.label}
              </div>
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
                      {item.badge && (
                        <Badge
                          variant="outline"
                          className="ml-auto h-4 px-1.5 text-[10px] font-normal"
                        >
                          {item.badge}
                        </Badge>
                      )}
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
