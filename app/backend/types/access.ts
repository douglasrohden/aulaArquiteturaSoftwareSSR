/** Chaves de tela alinhadas à tabela `screens` e aos seeds em `db.ts`. */
export const SCREEN_KEYS = ['home', 'products', 'users'] as const;

export type ScreenKey = (typeof SCREEN_KEYS)[number];

export interface ScreenRow {
  key: ScreenKey;
  label: string;
  sort_order: number;
}

export interface AccessProfileRow {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ScreenPermissions {
  view: boolean;
  add: boolean;
  edit: boolean;
  delete: boolean;
}

export type PermissionMatrix = Record<ScreenKey, ScreenPermissions>;

export interface ProfilePermissionInput {
  screen_key: ScreenKey;
  can_view: boolean;
  can_add: boolean;
  can_edit: boolean;
  can_delete: boolean;
}

const emptyScreenPermissions = (): ScreenPermissions => ({
  view: false,
  add: false,
  edit: false,
  delete: false,
});

export function emptyPermissionMatrix(): PermissionMatrix {
  return SCREEN_KEYS.reduce((acc, key) => {
    acc[key] = emptyScreenPermissions();
    return acc;
  }, {} as PermissionMatrix);
}
