'use client'

import Link from 'next/link'
import { LayoutGrid } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Icon } from '@/components/icons'
import { cn } from '@/lib/utils'
import type { ModuleDef } from '@/lib/navigation'

interface AppSwitcherProps {
  modules: ModuleDef[]
}

export function AppSwitcher({ modules }: AppSwitcherProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Cambiar módulo">
          <LayoutGrid className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-[360px] p-3"
        sideOffset={8}
      >
        <div className="mb-2 px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Módulos
        </div>
        <div className="grid grid-cols-2 gap-2">
          {modules.map((m) => (
            <Link
              key={m.key}
              href={m.href}
              className="group flex flex-col items-start rounded-lg border bg-card p-3 transition-all hover:border-primary/50 hover:shadow-sm"
            >
              <div
                className={cn(
                  'mb-2 flex h-9 w-9 items-center justify-center rounded-md text-white',
                  m.color
                )}
              >
                <Icon name={m.icon} className="h-5 w-5" />
              </div>
              <div className="text-sm font-medium leading-tight">{m.label}</div>
              <div className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                {m.description}
              </div>
            </Link>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
