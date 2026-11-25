import type { Role } from './enums';

export const PERMISSIONS = [
  'settings:read', 'settings:write', 'team:manage', 'billing:manage',
  'catalog:read', 'catalog:write', 'inventory:read', 'inventory:write',
  'orders:read', 'orders:write', 'returns:read', 'returns:write',
  'customers:read', 'customers:write', 'marketing:read', 'marketing:write',
  'inbox:read', 'inbox:write', 'analytics:read', 'ai:use',
  'integrations:manage', 'developer:manage', 'audit:read',
] as const;
export type Permission = (typeof PERMISSIONS)[number];

const ALL = [...PERMISSIONS];

export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  OWNER: ALL,
  ADMIN: ALL.filter((p) => p !== 'billing:manage'),
  MANAGER: [
    'settings:read', 'catalog:read', 'catalog:write', 'inventory:read', 'inventory:write',
    'orders:read', 'orders:write', 'returns:read', 'returns:write', 'customers:read', 'customers:write',
    'marketing:read', 'marketing:write', 'inbox:read', 'inbox:write', 'analytics:read', 'ai:use',
  ],
  STAFF: [
    'settings:read', 'catalog:read', 'catalog:write', 'inventory:read', 'inventory:write',
    'orders:read', 'orders:write', 'returns:read', 'returns:write', 'customers:read', 'ai:use',
  ],
  SUPPORT: [
    'settings:read', 'catalog:read', 'orders:read', 'returns:read', 'returns:write',
    'customers:read', 'customers:write', 'inbox:read', 'inbox:write',
  ],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

/** Roles a given role may assign to others (cannot escalate above itself). */
export function assignableRoles(role: Role): Role[] {
  if (role === 'OWNER') return ['ADMIN', 'MANAGER', 'STAFF', 'SUPPORT'];
  if (role === 'ADMIN') return ['MANAGER', 'STAFF', 'SUPPORT'];
  return [];
}
