'use client';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { Permission } from '@abaya/shared';
import { api, refreshAccessToken, setAccessToken } from './api';

export interface Me {
  user: { id: string; email: string; fullName: string; locale: string; isPlatformAdmin: boolean };
  tenant: Record<string, any> & { id: string; slug: string; nameAr: string; nameEn: string | null; isDemo: boolean; vatEnabled: boolean; vatRateBps: number; pricesIncludeVat: boolean };
  role: 'OWNER' | 'ADMIN' | 'MANAGER' | 'STAFF' | 'SUPPORT';
  permissions: Permission[];
  memberships: { role: string; tenant: { id: string; slug: string; nameAr: string; nameEn: string | null } }[];
}

interface AuthCtx {
  ready: boolean;
  me: Me | null;
  can: (p: Permission) => boolean;
  login: (token: string) => Promise<void>;
  logout: () => Promise<void>;
  switchTenant: (tenantId: string) => Promise<void>;
}
const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const qc = useQueryClient();
  const [booted, setBooted] = useState(false);
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    refreshAccessToken().then((t) => {
      setHasToken(Boolean(t));
      setBooted(true);
    });
  }, []);

  const meQ = useQuery({ queryKey: ['me'], queryFn: () => api<Me>('/auth/me'), enabled: booted && hasToken, staleTime: 60_000, retry: false });

  const login = useCallback(async (token: string) => {
    setAccessToken(token);
    setHasToken(true);
    await qc.invalidateQueries();
    await qc.fetchQuery({ queryKey: ['me'], queryFn: () => api<Me>('/auth/me') });
  }, [qc]);

  const logout = useCallback(async () => {
    await api('/auth/logout', { method: 'POST' }).catch(() => undefined);
    setAccessToken(null);
    setHasToken(false);
    qc.clear();
    window.location.href = '/login';
  }, [qc]);

  const switchTenant = useCallback(async (tenantId: string) => {
    const r = await api<{ accessToken: string }>(`/auth/switch-tenant/${tenantId}`, { method: 'POST' });
    setAccessToken(r.accessToken);
    qc.clear();
    window.location.href = '/dashboard';
  }, [qc]);

  const me = meQ.data ?? null;
  const value: AuthCtx = {
    ready: booted && (!hasToken || !meQ.isLoading),
    me,
    can: (p) => Boolean(me?.permissions.includes(p)),
    login, logout, switchTenant,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error('AuthProvider missing');
  return v;
}
