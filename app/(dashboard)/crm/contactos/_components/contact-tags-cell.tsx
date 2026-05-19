import { cn } from '@/lib/utils'

interface TagPill {
  id: string
  name: string
  color: string
}

/**
 * Convert a hex color to readable text color on a tinted background.
 * Used for tag chips — they show the tag name on a light wash of their color.
 */
function tagStyle(hex: string): React.CSSProperties {
  return {
    backgroundColor: `${hex}1f`, // ~12% alpha
    color: hex,
    borderColor: `${hex}40`, // ~25% alpha
  }
}

export function ContactTagsCell({ tags, max = 2 }: { tags: TagPill[]; max?: number }) {
  if (tags.length === 0) {
    return <span className="text-muted-foreground">—</span>
  }

  const visible = tags.slice(0, max)
  const rest = tags.length - visible.length

  return (
    <div className="flex flex-wrap items-center gap-1">
      {visible.map((t) => (
        <span
          key={t.id}
          className={cn(
            'inline-flex items-center rounded-md border px-1.5 py-0.5 text-[11px] font-medium'
          )}
          style={tagStyle(t.color)}
        >
          {t.name}
        </span>
      ))}
      {rest > 0 && (
        <span className="inline-flex items-center rounded-md border bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
          +{rest}
        </span>
      )}
    </div>
  )
}
