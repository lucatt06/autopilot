import { AppSwitcher } from '@/components/layout/app-switcher'
import { UserMenu } from '@/components/layout/user-menu'
import { getVisibleModules } from '@/lib/navigation'
import type { SessionUser } from '@/lib/auth'

interface WelcomeBarProps {
  user: SessionUser
}

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Buenos días'
  if (hour < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

export function WelcomeBar({ user }: WelcomeBarProps) {
  const modules = getVisibleModules(user.role, user.workspace?.enabledModules ?? [])

  return (
    <header className="border-b bg-background">
      <div className="flex h-14 items-center gap-3 px-4">
        <AppSwitcher modules={modules} />

        <div className="hidden text-sm md:block">
          <span className="text-muted-foreground">{getGreeting()},</span>{' '}
          <span className="font-medium">{user.firstName}</span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <UserMenu
            firstName={user.firstName}
            lastName={user.lastName}
            email={user.email}
            avatarUrl={user.avatar}
            workspaceName={user.workspace?.name ?? null}
            role={user.role}
          />
        </div>
      </div>
    </header>
  )
}
