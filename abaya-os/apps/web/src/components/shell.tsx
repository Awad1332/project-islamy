'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ChevronsUpDown, Languages, LogOut, Menu, Plus, ShoppingBag, UserPlus, X } from 'lucide-react';
import type { Permission } from '@abaya/shared';
import { useAuth } from '@/lib/auth';
import { useUiMode } from '@/lib/mode';
import { useI18n } from '@/i18n';
import { cn } from '@/lib/utils';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Dropdown, DropdownContent, DropdownItem, DropdownLabel, DropdownSeparator, DropdownTrigger } from './ui/dropdown';
import { LoadingState } from './states';
import { AbayaIcon, ICONS } from './icons';
import { Brand } from './brand';

type Item = { href: string; key: string; perm?: Permission; admin?: boolean; simple?: boolean };
const GROUPS: { key: string; items: Item[] }[] = [
  { key: '', items: [{ href: '/dashboard', key: 'dashboard', simple: true }] },
  { key: 'sell', items: [
    { href: '/orders', key: 'orders', perm: 'orders:read', simple: true },
    { href: '/returns', key: 'returns', perm: 'returns:read', simple: true },
    { href: '/customers', key: 'customers', perm: 'customers:read', simple: true },
    { href: '/inbox', key: 'inbox', perm: 'inbox:read', simple: true },
  ] },
  { key: 'catalog', items: [
    { href: '/products', key: 'products', perm: 'catalog:read', simple: true },
    { href: '/categories', key: 'categories', perm: 'catalog:read' },
    { href: '/inventory', key: 'inventory', perm: 'inventory:read' },
    { href: '/sizing', key: 'sizing', perm: 'catalog:read', simple: true },
  ] },
  { key: 'growth', items: [
    { href: '/ai', key: 'ai', perm: 'ai:use' },
    { href: '/ai/images', key: 'images', perm: 'ai:use' },
    { href: '/marketing', key: 'marketing', perm: 'marketing:read' },
    { href: '/analytics', key: 'analytics', perm: 'analytics:read' },
  ] },
  { key: 'store', items: [
    { href: '/integrations', key: 'integrations', perm: 'integrations:manage' },
    { href: '/settings', key: 'settings', perm: 'settings:read', simple: true },
    { href: '/settings/team', key: 'team', perm: 'team:manage' },
    { href: '/settings/billing', key: 'billing', perm: 'billing:manage' },
    { href: '/settings/developer', key: 'developer', perm: 'developer:manage' },
    { href: '/settings/audit', key: 'audit', perm: 'audit:read' },
    { href: '/admin', key: 'admin', admin: true },
  ] },
];
const ALL = GROUPS.flatMap((g) => g.items);

export function ModeSwitch({ className }: { className?: string }) {
  const { mode, setMode } = useUiMode();
  const { t } = useI18n();
  return (
    <div role="radiogroup" aria-label={t('mode.label')} className={cn('inline-flex rounded-full bg-muted p-1 text-xs', className)}>
      {(['simple', 'pro'] as const).map((m) => (
        <button key={m} role="radio" aria-checked={mode === m} title={t(m === 'simple' ? 'mode.simpleHint' : 'mode.proHint')} onClick={() => setMode(m)}
          className={cn('rounded-full px-3 py-1.5 font-medium transition', mode === m ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground')}>
          {t(`mode.${m}`)}
        </button>
      ))}
    </div>
  );
}

function QuickAdd({ onDone }: { onDone?: () => void }) {
  const { t } = useI18n();
  const { can } = useAuth();
  const items = [
    can('catalog:write') && { href: '/products/new', label: t('home.addAbaya'), icon: AbayaIcon },
    can('orders:write') && { href: '/orders/new', label: t('home.newOrder'), icon: ShoppingBag },
    can('customers:write') && { href: '/customers?new=1', label: t('home.addCustomer'), icon: UserPlus },
  ].filter(Boolean) as { href: string; label: string; icon: React.ComponentType<{ className?: string }> }[];
  return (
    <div className="grid gap-2">
      {items.map((i) => (
        <Link key={i.href} href={i.href} onClick={onDone} className="flex items-center gap-3 rounded-xl border bg-card p-4 text-base font-medium hover:border-gold">
          <span className="flex size-10 items-center justify-center rounded-xl bg-gold-100 text-gold-700"><i.icon className="size-5" /></span>
          {i.label}
        </Link>
      ))}
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { ready, me, can, logout, switchTenant } = useAuth();
  const { pro, setMode } = useUiMode();
  const { t, locale, setLocale } = useI18n();
  const pathname = usePathname();
  const router = useRouter();
  const [drawer, setDrawer] = useState(false);
  const [quick, setQuick] = useState(false);

  useEffect(() => {
    if (ready && !me) router.replace('/login');
  }, [ready, me, router]);
  useEffect(() => { setDrawer(false); setQuick(false); }, [pathname]);

  if (!ready || !me) return <div className="p-10"><LoadingState rows={6} /></div>;

  const visible = (i: Item) => (i.admin ? me.user.isPlatformAdmin : !i.perm || can(i.perm)) && (pro || i.simple);
  const isActive = (href: string) => (href === '/dashboard' ? pathname === href : (pathname === href || pathname.startsWith(href + '/')) && !ALL.some((i) => i.href !== href && i.href.startsWith(href + '/') && pathname.startsWith(i.href)));
  const storeName = locale === 'en' && me.tenant.nameEn ? me.tenant.nameEn : me.tenant.nameAr;

  const NavLink = ({ i }: { i: Item }) => {
    const Icon = ICONS[i.key];
    return (
      <Link href={i.href} className={cn('flex items-center gap-3 rounded-lg px-3 text-ivory/75 transition hover:bg-white/5 hover:text-ivory', pro ? 'py-2 text-sm' : 'py-2.5 text-[15px]', isActive(i.href) && 'bg-white/10 text-ivory')}>
        <Icon className={cn(pro ? 'size-4' : 'size-5', isActive(i.href) && 'text-gold-300')} strokeWidth={1.75} />
        {t(`nav.${i.key}`)}
      </Link>
    );
  };

  const nav = (
    <nav className="flex h-full flex-col gap-5 overflow-y-auto p-4">
      <div className="flex items-center justify-between px-1">
        <Link href="/dashboard"><Brand inverted /></Link>
        <button className="text-ivory/70 lg:hidden" onClick={() => setDrawer(false)} aria-label={t('common.close')}><X className="size-5" /></button>
      </div>
      {pro ? GROUPS.map((g) => {
        const items = g.items.filter(visible);
        if (!items.length) return null;
        return (
          <div key={g.key || 'home'} className="space-y-0.5">
            {g.key && <div className="px-3 pb-1 text-[11px] font-medium uppercase tracking-wider text-gold-300/80">{t(`nav.groups.${g.key}`)}</div>}
            {items.map((i) => <NavLink key={i.href} i={i} />)}
          </div>
        );
      }) : <div className="space-y-1">{ALL.filter(visible).map((i) => <NavLink key={i.href} i={i} />)}</div>}
      {!pro && (
        <div className="mt-auto rounded-xl border border-white/10 bg-white/5 p-4 text-ivory/80">
          <p className="text-sm font-medium text-ivory">{t('mode.wantMore')}</p>
          <p className="mt-1 text-xs leading-relaxed">{t('mode.wantMoreSub')}</p>
          <Button size="sm" variant="gold" className="mt-3 w-full" onClick={() => setMode('pro')}>{t('mode.enablePro')}</Button>
        </div>
      )}
    </nav>
  );

  const bottom: Item[] = [ALL[0], ALL.find((i) => i.key === 'orders')!, ALL.find((i) => i.key === 'products')!, ALL.find((i) => i.key === 'customers')!].filter(visible);

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[264px_1fr]">
      <aside className="hidden bg-charcoal lg:sticky lg:top-0 lg:block lg:h-screen">{nav}</aside>
      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDrawer(false)} />
          <aside className="absolute inset-y-0 start-0 w-72 bg-charcoal">{nav}</aside>
        </div>
      )}
      <div className="flex min-w-0 flex-col pb-20 lg:pb-0">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b bg-background/90 px-4 backdrop-blur md:px-8">
          <div className="flex min-w-0 items-center gap-2">
            <button className="lg:hidden" onClick={() => setDrawer(true)} aria-label={t('common.more')}><Menu className="size-6" /></button>
            <Dropdown>
              <DropdownTrigger className="flex min-w-0 items-center gap-2 rounded-md px-2 py-1 text-sm font-medium hover:bg-accent">
                <span className="truncate">{storeName}</span>
                {me.tenant.isDemo && <Badge variant="gold">{t('common.demo')}</Badge>}
                {me.memberships.length > 1 && <ChevronsUpDown className="size-3.5 text-muted-foreground" />}
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
            <ModeSwitch className="hidden sm:inline-flex" />
            <Dropdown>
              <DropdownTrigger className="flex size-9 items-center justify-center rounded-full bg-gold-100 text-sm font-semibold text-gold-700" aria-label={me.user.fullName}>{me.user.fullName.slice(0, 1)}</DropdownTrigger>
              <DropdownContent>
                <DropdownLabel>{me.user.fullName} · {t(`team.roles.${me.role}`)}</DropdownLabel>
                <div className="px-2 py-1 sm:hidden"><ModeSwitch /></div>
                <DropdownItem onSelect={() => setLocale(locale === 'ar' ? 'en' : 'ar')}><Languages />{t('common.language')}</DropdownItem>
                <DropdownSeparator />
                <DropdownItem onSelect={() => logout()}><LogOut />{t('common.logout')}</DropdownItem>
              </DropdownContent>
            </Dropdown>
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 p-4 md:p-8">{children}</main>
      </div>

      {/* Mobile bottom bar with a central quick-add button */}
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        {bottom.slice(0, 2).map((i) => <BottomLink key={i.href} i={i} active={isActive(i.href)} label={t(`nav.${i.key}`)} />)}
        <button onClick={() => setQuick(true)} className="flex flex-col items-center justify-center" aria-label={t('common.quickAdd')}>
          <span className="-mt-6 flex size-14 items-center justify-center rounded-full bg-charcoal text-gold-300 shadow-lg ring-4 ring-background"><Plus className="size-7" /></span>
        </button>
        {bottom.slice(2, 4).map((i) => <BottomLink key={i.href} i={i} active={isActive(i.href)} label={t(`nav.${i.key}`)} />)}
      </nav>
      {quick && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setQuick(false)} />
          <div className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-background p-5 pb-8">
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-beige-300" />
            <p className="mb-3 font-display text-lg">{t('home.quick')}</p>
            <QuickAdd onDone={() => setQuick(false)} />
          </div>
        </div>
      )}
    </div>
  );
}

function BottomLink({ i, active, label }: { i: Item; active: boolean; label: string }) {
  const Icon = ICONS[i.key];
  return (
    <Link href={i.href} className={cn('flex flex-col items-center gap-1 py-2 text-[11px]', active ? 'text-gold-700' : 'text-muted-foreground')}>
      <Icon className="size-6" strokeWidth={1.75} />
      {label}
    </Link>
  );
}
