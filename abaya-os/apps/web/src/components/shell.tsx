'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  BarChart3, Boxes, Code2, CreditCard, FileClock, Image as ImageIcon, Inbox, LayoutDashboard, LogOut, Megaphone, Menu, PackageOpen,
  Plug, Ruler, Settings, Shield, ShoppingBag, Sparkles, Tags, Undo2, Users, UsersRound, ChevronsUpDown, Languages, X,
} from 'lucide-react';
import type { Permission } from '@abaya/shared';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/i18n';
import { cn } from '@/lib/utils';
import { Badge } from './ui/badge';
import { Dropdown, DropdownContent, DropdownItem, DropdownLabel, DropdownSeparator, DropdownTrigger } from './ui/dropdown';
import { LoadingState } from './states';

type Item = { href: string; key: string; icon: React.ComponentType<{ className?: string }>; perm?: Permission; admin?: boolean };
const GROUPS: { key: string; items: Item[] }[] = [
  { key: '', items: [{ href: '/dashboard', key: 'dashboard', icon: LayoutDashboard }] },
  { key: 'sell', items: [
    { href: '/orders', key: 'orders', icon: ShoppingBag, perm: 'orders:read' },
    { href: '/returns', key: 'returns', icon: Undo2, perm: 'returns:read' },
    { href: '/customers', key: 'customers', icon: Users, perm: 'customers:read' },
    { href: '/inbox', key: 'inbox', icon: Inbox, perm: 'inbox:read' },
  ] },
  { key: 'catalog', items: [
    { href: '/products', key: 'products', icon: PackageOpen, perm: 'catalog:read' },
    { href: '/categories', key: 'categories', icon: Tags, perm: 'catalog:read' },
    { href: '/inventory', key: 'inventory', icon: Boxes, perm: 'inventory:read' },
    { href: '/sizing', key: 'sizing', icon: Ruler, perm: 'catalog:read' },
  ] },
  { key: 'growth', items: [
    { href: '/ai', key: 'ai', icon: Sparkles, perm: 'ai:use' },
    { href: '/ai/images', key: 'images', icon: ImageIcon, perm: 'ai:use' },
    { href: '/marketing', key: 'marketing', icon: Megaphone, perm: 'marketing:read' },
    { href: '/analytics', key: 'analytics', icon: BarChart3, perm: 'analytics:read' },
  ] },
  { key: 'store', items: [
    { href: '/integrations', key: 'integrations', icon: Plug, perm: 'integrations:manage' },
    { href: '/settings', key: 'settings', icon: Settings, perm: 'settings:read' },
    { href: '/settings/team', key: 'team', icon: UsersRound, perm: 'team:manage' },
    { href: '/settings/billing', key: 'billing', icon: CreditCard, perm: 'billing:manage' },
    { href: '/settings/developer', key: 'developer', icon: Code2, perm: 'developer:manage' },
    { href: '/settings/audit', key: 'audit', icon: FileClock, perm: 'audit:read' },
    { href: '/admin', key: 'admin', icon: Shield, admin: true },
  ] },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { ready, me, can, logout, switchTenant } = useAuth();
  const { t, locale, setLocale } = useI18n();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (ready && !me) router.replace('/login');
  }, [ready, me, router]);
  useEffect(() => setOpen(false), [pathname]);

  if (!ready || !me) return <div className="p-10"><LoadingState rows={6} /></div>;

  const storeName = locale === 'en' && me.tenant.nameEn ? me.tenant.nameEn : me.tenant.nameAr;
  const isActive = (href: string) => (href === '/dashboard' ? pathname === href : pathname === href || (pathname.startsWith(href + '/') && !GROUPS.flatMap((g) => g.items).some((i) => i.href !== href && i.href.startsWith(href + '/') && pathname.startsWith(i.href))));

  const nav = (
    <nav className="flex h-full flex-col gap-5 overflow-y-auto p-4">
      <div className="flex items-center justify-between px-2">
        <Link href="/dashboard" className="font-display text-xl tracking-wide text-ivory">{t('app.name')}</Link>
        <button className="text-ivory/70 lg:hidden" onClick={() => setOpen(false)} aria-label="close"><X className="size-5" /></button>
      </div>
      {GROUPS.map((g) => {
        const items = g.items.filter((i) => (i.admin ? me.user.isPlatformAdmin : !i.perm || can(i.perm)));
        if (!items.length) return null;
        return (
          <div key={g.key || 'home'} className="space-y-1">
            {g.key && <div className="px-2 pb-1 text-[11px] font-medium uppercase tracking-wider text-gold-300/80">{t(`nav.groups.${g.key}`)}</div>}
            {items.map((i) => (
              <Link key={i.href} href={i.href} className={cn('flex items-center gap-3 rounded-md px-3 py-2 text-sm text-ivory/75 transition hover:bg-white/5 hover:text-ivory', isActive(i.href) && 'bg-white/10 text-ivory shadow-[inset_-2px_0_0_0_#B8975A] ltr:shadow-[inset_2px_0_0_0_#B8975A]')}>
                <i.icon className="size-4" />
                {t(`nav.${i.key}`)}
              </Link>
            ))}
          </div>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="hidden bg-charcoal lg:block lg:sticky lg:top-0 lg:h-screen">{nav}</aside>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 start-0 w-72 bg-charcoal">{nav}</aside>
        </div>
      )}
      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b bg-background/90 px-4 backdrop-blur md:px-8">
          <div className="flex items-center gap-3">
            <button className="lg:hidden" onClick={() => setOpen(true)} aria-label="menu"><Menu className="size-5" /></button>
            <Dropdown>
              <DropdownTrigger className="flex items-center gap-2 rounded-md px-2 py-1 text-sm font-medium hover:bg-accent">
                {storeName}
                {me.tenant.isDemo && <Badge variant="gold">{t('common.demo')}</Badge>}
                <ChevronsUpDown className="size-3.5 text-muted-foreground" />
              </DropdownTrigger>
              <DropdownContent align="start">
                <DropdownLabel>{me.tenant.slug}</DropdownLabel>
                {me.memberships.filter((m) => m.tenant.id !== me.tenant.id).map((m) => (
                  <DropdownItem key={m.tenant.id} onSelect={() => switchTenant(m.tenant.id)}>{locale === 'en' && m.tenant.nameEn ? m.tenant.nameEn : m.tenant.nameAr}</DropdownItem>
                ))}
              </DropdownContent>
            </Dropdown>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setLocale(locale === 'ar' ? 'en' : 'ar')} className="flex items-center gap-1 rounded-md px-2 py-1 text-sm hover:bg-accent"><Languages className="size-4" />{t('common.language')}</button>
            <Dropdown>
              <DropdownTrigger className="flex size-9 items-center justify-center rounded-full bg-gold-100 text-sm font-semibold text-gold-700">{me.user.fullName.slice(0, 1)}</DropdownTrigger>
              <DropdownContent>
                <DropdownLabel>{me.user.fullName} · {t(`team.roles.${me.role}`)}</DropdownLabel>
                <DropdownSeparator />
                <DropdownItem onSelect={() => logout()}><LogOut />{t('common.logout')}</DropdownItem>
              </DropdownContent>
            </Dropdown>
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
