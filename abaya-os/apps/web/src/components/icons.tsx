/**
 * ONE icon per concept, used everywhere (navigation, page headers, quick actions, empty states).
 * Style: lucide line icons, 1.75 stroke, rounded caps — plus a custom abaya glyph for products.
 */
import {
  BarChart3, Boxes, Code2, CreditCard, History, ImageIcon, LayoutGrid, Megaphone, MessageCircle, Plug, RefreshCcw,
  Ruler, Settings, ShieldCheck, ShoppingBag, Sparkles, Tags, UserRound, UsersRound, type LucideProps,
} from 'lucide-react';
import type { ComponentType, SVGProps } from 'react';

export function AbayaIcon({ className, strokeWidth = 1.75 }: { className?: string; strokeWidth?: number | string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M9.2 4.2a2.8 2.8 0 0 1 5.6 0" />
      <path d="M9.2 4.2 7.4 8.6 4.5 20.5h15L16.6 8.6l-1.8-4.4" />
      <path d="M7.4 8.6 4.6 13.4M16.6 8.6l2.8 4.8" />
      <path d="M12 7.2v13.3" />
    </svg>
  );
}

type IconC = ComponentType<LucideProps> | ComponentType<SVGProps<SVGSVGElement> & { strokeWidth?: number | string }>;
export const ICONS: Record<string, IconC> = {
  dashboard: LayoutGrid,
  orders: ShoppingBag,
  returns: RefreshCcw,
  customers: UserRound,
  inbox: MessageCircle,
  products: AbayaIcon,
  categories: Tags,
  inventory: Boxes,
  sizing: Ruler,
  ai: Sparkles,
  images: ImageIcon,
  marketing: Megaphone,
  analytics: BarChart3,
  integrations: Plug,
  settings: Settings,
  team: UsersRound,
  billing: CreditCard,
  developer: Code2,
  audit: History,
  admin: ShieldCheck,
};

/** Route → concept, so page headers pick the same icon as the navigation automatically. */
export const ROUTE_ICON: [string, string][] = [
  ['/settings/team', 'team'], ['/settings/billing', 'billing'], ['/settings/developer', 'developer'], ['/settings/audit', 'audit'],
  ['/ai/images', 'images'], ['/dashboard', 'dashboard'], ['/orders', 'orders'], ['/returns', 'returns'], ['/customers', 'customers'],
  ['/inbox', 'inbox'], ['/products', 'products'], ['/categories', 'categories'], ['/inventory', 'inventory'], ['/sizing', 'sizing'],
  ['/ai', 'ai'], ['/marketing', 'marketing'], ['/analytics', 'analytics'], ['/integrations', 'integrations'], ['/settings', 'settings'], ['/admin', 'admin'],
];
export function iconForPath(path: string): IconC | null {
  const hit = ROUTE_ICON.find(([p]) => path === p || path.startsWith(p + '/'));
  return hit ? ICONS[hit[1]] : null;
}
