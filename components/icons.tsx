import {
  Banknote,
  Bell,
  Bot,
  Brain,
  Briefcase,
  Building2,
  Calendar,
  CheckSquare,
  ClipboardList,
  ContactRound,
  CreditCard,
  FileSignature,
  FileText,
  Filter,
  Folder,
  Globe,
  HardHat,
  Headphones,
  Home,
  Inbox,
  KeyRound,
  LayoutDashboard,
  LayoutGrid,
  ListChecks,
  ListTodo,
  MapPin,
  Megaphone,
  MessageSquare,
  Network,
  Package,
  Palette,
  PhoneCall,
  Plug,
  Receipt,
  Route,
  ScrollText,
  Settings,
  ShieldCheck,
  Sparkles,
  Tag,
  Tags,
  Target,
  Truck,
  UserCog,
  Users,
  Wallet,
  Wrench,
  type LucideIcon,
} from 'lucide-react'

/**
 * Icon name → component lookup.
 *
 * Why this exists: Next.js forbids passing functions (including React component
 * references) as props from Server Components to Client Components. Storing the
 * icon as a serializable string name lets navigation config flow safely across
 * the boundary; the client renders the actual icon via this map.
 */
const ICON_MAP = {
  Banknote,
  Bell,
  Bot,
  Brain,
  Briefcase,
  Building2,
  Calendar,
  CheckSquare,
  ClipboardList,
  ContactRound,
  CreditCard,
  FileSignature,
  FileText,
  Filter,
  Folder,
  Globe,
  HardHat,
  Headphones,
  Home,
  Inbox,
  KeyRound,
  LayoutDashboard,
  LayoutGrid,
  ListChecks,
  ListTodo,
  MapPin,
  Megaphone,
  MessageSquare,
  Network,
  Package,
  Palette,
  PhoneCall,
  Plug,
  Receipt,
  Route,
  ScrollText,
  Settings,
  ShieldCheck,
  Sparkles,
  Tag,
  Tags,
  Target,
  Truck,
  UserCog,
  Users,
  Wallet,
  Wrench,
} satisfies Record<string, LucideIcon>

export type IconName = keyof typeof ICON_MAP

export function Icon({
  name,
  className,
}: {
  name: IconName | string
  className?: string
}) {
  const Component = (ICON_MAP as Record<string, LucideIcon>)[name] ?? Building2
  return <Component className={className} />
}
