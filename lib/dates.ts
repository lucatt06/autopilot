import { formatDistanceToNowStrict } from 'date-fns'
import { es } from 'date-fns/locale'
import { formatInTimeZone } from 'date-fns-tz'

/**
 * Format a Date in the given IANA timezone. Default is workspace tz.
 * Example output: "May 17, 2026 06:36 PM"
 */
export function formatDateTime(date: Date | string, timezone = 'America/Santo_Domingo'): string {
  return formatInTimeZone(new Date(date), timezone, 'MMM d, yyyy hh:mm a')
}

export function formatDate(date: Date | string, timezone = 'America/Santo_Domingo'): string {
  return formatInTimeZone(new Date(date), timezone, 'MMM d, yyyy')
}

/**
 * Relative time like "21 hours ago" / "2 days ago" / "ahora".
 */
export function formatRelative(date: Date | string): string {
  const d = new Date(date)
  const diff = Date.now() - d.getTime()
  if (diff < 30_000) return 'ahora'
  return `${formatDistanceToNowStrict(d, { locale: es })} ago`.replace(/\bsegundos? ago\b/, 'ahora')
}
