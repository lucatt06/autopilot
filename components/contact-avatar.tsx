import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

const PALETTE = [
  'bg-blue-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-violet-500',
  'bg-cyan-500',
  'bg-fuchsia-500',
  'bg-indigo-500',
  'bg-orange-500',
  'bg-teal-500',
]

function hashString(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

function initials(first: string, last: string): string {
  return `${first[0] ?? ''}${last[0] ?? ''}`.toUpperCase() || '?'
}

interface ContactAvatarProps {
  firstName: string
  lastName: string
  className?: string
}

export function ContactAvatar({ firstName, lastName, className }: ContactAvatarProps) {
  const idx = hashString(`${firstName}${lastName}`) % PALETTE.length
  const color = PALETTE[idx]

  return (
    <Avatar className={cn('h-7 w-7', className)}>
      <AvatarFallback className={cn(color, 'text-[10px] font-semibold text-white')}>
        {initials(firstName, lastName)}
      </AvatarFallback>
    </Avatar>
  )
}
