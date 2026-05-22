import { cn } from '@/lib/utils'
import { tokenize } from '@/lib/mentions/parse'

/**
 * Renders text that may contain `@[Name](userId)` mention markup, turning each
 * mention into a styled chip. Plain text (no markup) renders unchanged.
 * No interactivity → safe as a Server Component.
 */
export function MentionText({
  text,
  className,
}: {
  text: string | null | undefined
  className?: string
}) {
  const tokens = tokenize(text)
  if (tokens.length === 0) return null

  return (
    <span className={cn('whitespace-pre-wrap break-words', className)}>
      {tokens.map((t, i) =>
        t.type === 'mention' ? (
          <span
            key={i}
            className="rounded bg-primary/10 px-1 font-medium text-primary"
            data-mention-user-id={t.userId}
          >
            @{t.name}
          </span>
        ) : (
          <span key={i}>{t.value}</span>
        ),
      )}
    </span>
  )
}
