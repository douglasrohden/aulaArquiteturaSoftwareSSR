// Server-side database — Neon (PostgreSQL) via @neondatabase/serverless
import { Pool } from '@neondatabase/serverless';
import { Product, CreateProductInput } from './types';
import { StoredUser, InsertUserRow } from './types/user';
import {
  SCREEN_KEYS,
  type ScreenKey,
  type PermissionMatrix,
  type ProfilePermissionInput,
  type AccessProfileRow,
  type ScreenRow,
  emptyPermissionMatrix,
} from './types/access';

declare global {
  // eslint-disable-next-line no-var -- singleton across HMR / serverless warm starts
  var __neonPool: Pool | undefined;
}

function getPool(): Pool {
  const url = process.env.DATABASE_URL;
  if (!url?.trim()) {
    throw new Error(
      'DATABASE_URL não está definido. Crie um projeto em https://neon.tech e cole a connection string no .env.local.'
    );
  }
  if (!globalThis.__neonPool) {
    globalThis.__neonPool = new Pool({ connectionString: url });
  }
  return globalThis.__neonPool;
}

/** Converte placeholders estilo SQLite (`?`) para PostgreSQL (`$1`, `$2`, …). */
function preparePg(sqliteStyle: string, paramCount: number): string {
  let i = 0;
  const text = sqliteStyle.replace(/\?/g, () => `$${++i}`);
  if (i !== paramCount) {
    throw new Error(
      `Incompatibilidade de parâmetros SQL: ${i} placeholders, ${paramCount} valores.`
    );
  }
  return text;
}

/** Execução direta (usada nas migrações, sem `ensureMigrated`). */
async function execRaw(sql: string, params: unknown[] = []): Promise<void> {
  await getPool().query(preparePg(sql, params.length), params);
}

async function queryRawAll<T>(sql: string, params: unknown[] = []): Promise<T[]> {
  const { rows } = await getPool().query(preparePg(sql, params.length), params);
  return rows as T[];
}

async function queryRawOne<T>(sql: string, params: unknown[] = []): Promise<T | null> {
  const { rows } = await getPool().query(preparePg(sql, params.length), params);
  return (rows[0] as T | undefined) ?? null;
}

let migrationsPromise: Promise<void> | null = null;

async function ensureMigrated(): Promise<void> {
  if (!migrationsPromise) {
    migrationsPromise = runMigrations().catch((err) => {
      migrationsPromise = null;
      throw err;
    });
  }
  await migrationsPromise;
}

async function exec(sql: string, params: unknown[] = []): Promise<void> {
  await ensureMigrated();
  await execRaw(sql, params);
}

async function queryAll<T>(sql: string, params: unknown[] = []): Promise<T[]> {
  await ensureMigrated();
  return queryRawAll<T>(sql, params);
}

async function queryOne<T>(sql: string, params: unknown[] = []): Promise<T | null> {
  await ensureMigrated();
  return queryRawOne<T>(sql, params);
}

function rowToStoredUser(row: Record<string, unknown>): StoredUser {
  const activeRaw = row.isActive;
  const isActive =
    activeRaw === null || activeRaw === undefined
      ? true
      : activeRaw === true ||
        activeRaw === 't' ||
        activeRaw === 'true' ||
        Number(activeRaw) === 1;

  return {
    id: String(row.id),
    name: String(row.name),
    email: String(row.email),
    password_hash: String(row.password_hash),
    phone: row.phone != null ? String(row.phone) : null,
    avatar: row.avatar != null ? String(row.avatar) : null,
    bio: row.bio != null ? String(row.bio) : null,
    role:
      row.role != null && (row.role === 'admin' || row.role === 'user')
        ? row.role
        : null,
    isActive,
    profile_id:
      row.profile_id !== undefined && row.profile_id !== null
        ? String(row.profile_id)
        : null,
    createdAt: String(row.createdAt),
    updatedAt: String(row.updatedAt),
  };
}

async function migrateUsersTable(): Promise<void> {
  const exists = await queryRawOne<{ exists: boolean }>(
    `SELECT EXISTS (
       SELECT 1 FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = 'users'
     ) AS exists`,
    []
  );
  if (!exists?.exists) return;

  const cols = await queryRawAll<{ column_name: string }>(
    `SELECT column_name FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'users'`,
    []
  );
  const names = new Set(cols.map((c) => c.column_name));

  if (names.has('password') && !names.has('password_hash')) {
    await execRaw('ALTER TABLE users RENAME COLUMN password TO password_hash');
    names.delete('password');
    names.add('password_hash');
  }

  const addColumn = async (columnName: string, sqlName: string, columnDef: string) => {
    if (!names.has(columnName)) {
      await execRaw(`ALTER TABLE users ADD COLUMN ${sqlName} ${columnDef}`);
    }
  };

  await addColumn('phone', 'phone', 'TEXT');
  await addColumn('avatar', 'avatar', 'TEXT');
  await addColumn('bio', 'bio', 'TEXT');
  await addColumn('role', 'role', 'TEXT');
  await addColumn('isActive', '"isActive"', 'BOOLEAN NOT NULL DEFAULT TRUE');
}

async function migrateAccessControl(): Promise<void> {
  await execRaw(`
    CREATE TABLE IF NOT EXISTS screens (
      key TEXT PRIMARY KEY,
      label TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0
    )
  `);

  await execRaw(`
    CREATE TABLE IF NOT EXISTS access_profiles (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      "createdAt" TEXT NOT NULL,
      "updatedAt" TEXT NOT NULL
    )
  `);

  await execRaw(`
    CREATE TABLE IF NOT EXISTS profile_screen_permissions (
      profile_id TEXT NOT NULL,
      screen_key TEXT NOT NULL,
      can_view BOOLEAN NOT NULL DEFAULT FALSE,
      can_add BOOLEAN NOT NULL DEFAULT FALSE,
      can_edit BOOLEAN NOT NULL DEFAULT FALSE,
      can_delete BOOLEAN NOT NULL DEFAULT FALSE,
      PRIMARY KEY (profile_id, screen_key),
      FOREIGN KEY (profile_id) REFERENCES access_profiles(id) ON DELETE CASCADE,
      FOREIGN KEY (screen_key) REFERENCES screens(key) ON DELETE CASCADE
    )
  `);

  const screenSeeds: [string, string, number][] = [
    ['home', 'Início', 1],
    ['products', 'Produtos', 2],
    ['users', 'Usuários', 3],
  ];
  for (const [key, label, sort_order] of screenSeeds) {
    await execRaw(
      `INSERT INTO screens (key, label, sort_order) VALUES (?, ?, ?)
       ON CONFLICT (key) DO NOTHING`,
      [key, label, sort_order]
    );
  }

  const userCols = await queryRawAll<{ column_name: string }>(
    `SELECT column_name FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'users'`,
    []
  );
  const userNames = new Set(userCols.map((c) => c.column_name));
  if (!userNames.has('profile_id')) {
    await execRaw(
      'ALTER TABLE users ADD COLUMN profile_id TEXT REFERENCES access_profiles(id) ON DELETE SET NULL'
    );
  }

  const now = new Date().toISOString();

  let adminRow = await queryRawOne<{ id: string }>(
    'SELECT id FROM access_profiles WHERE name = ? LIMIT 1',
    ['Administrador']
  );
  let adminProfileId: string;
  if (!adminRow) {
    adminProfileId = Date.now().toString();
    await execRaw(
      `INSERT INTO access_profiles (id, name, description, "createdAt", "updatedAt")
       VALUES (?, ?, ?, ?, ?)`,
      [
        adminProfileId,
        'Administrador',
        'Visualizar, incluir, editar e excluir em todas as telas.',
        now,
        now,
      ]
    );
    for (const key of SCREEN_KEYS) {
      await execRaw(
        `INSERT INTO profile_screen_permissions
         (profile_id, screen_key, can_view, can_add, can_edit, can_delete)
         VALUES (?, ?, TRUE, TRUE, TRUE, TRUE)
         ON CONFLICT (profile_id, screen_key) DO NOTHING`,
        [adminProfileId, key]
      );
    }
  } else {
    adminProfileId = adminRow.id;
    for (const key of SCREEN_KEYS) {
      await execRaw(
        `INSERT INTO profile_screen_permissions
         (profile_id, screen_key, can_view, can_add, can_edit, can_delete)
         VALUES (?, ?, TRUE, TRUE, TRUE, TRUE)
         ON CONFLICT (profile_id, screen_key) DO NOTHING`,
        [adminProfileId, key]
      );
    }
  }

  let readerRow = await queryRawOne<{ id: string }>(
    'SELECT id FROM access_profiles WHERE name = ? LIMIT 1',
    ['Leitor']
  );
  if (!readerRow) {
    const readerId = (Date.now() + 1).toString();
    await execRaw(
      `INSERT INTO access_profiles (id, name, description, "createdAt", "updatedAt")
       VALUES (?, ?, ?, ?, ?)`,
      [
        readerId,
        'Leitor',
        'Somente visualização em todas as telas.',
        now,
        now,
      ]
    );
    for (const key of SCREEN_KEYS) {
      await execRaw(
        `INSERT INTO profile_screen_permissions
         (profile_id, screen_key, can_view, can_add, can_edit, can_delete)
         VALUES (?, ?, TRUE, FALSE, FALSE, FALSE)`,
        [readerId, key]
      );
    }
  }

  await execRaw('UPDATE users SET profile_id = ? WHERE profile_id IS NULL', [
    adminProfileId,
  ]);
}

async function runMigrations(): Promise<void> {
  await execRaw(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      price DOUBLE PRECISION NOT NULL,
      stock INTEGER NOT NULL,
      category TEXT,
      "createdAt" TEXT NOT NULL,
      "updatedAt" TEXT NOT NULL
    )
  `);

  await execRaw(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      phone TEXT,
      avatar TEXT,
      bio TEXT,
      role TEXT,
      "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
      "createdAt" TEXT NOT NULL,
      "updatedAt" TEXT NOT NULL
    )
  `);

  await migrateUsersTable();
  await migrateAccessControl();
}

export function initDatabase(): Promise<void> {
  return ensureMigrated();
}

export async function getAllProducts(): Promise<Product[]> {
  const rows = await queryAll<Product>('SELECT * FROM products');
  return rows.map((r) => ({
    ...r,
    price: Number(r.price),
    stock: Number(r.stock),
  }));
}

export async function getProductById(id: string): Promise<Product | null> {
  const row = await queryOne<Product>('SELECT * FROM products WHERE id = ?', [id]);
  if (!row) return null;
  return {
    ...row,
    price: Number(row.price),
    stock: Number(row.stock),
  };
}

export async function createProduct(data: CreateProductInput): Promise<Product> {
  const id = Date.now().toString();
  const createdAt = new Date().toISOString();
  const updatedAt = createdAt;

  await exec(
    `
    INSERT INTO products (id, name, description, price, stock, category, "createdAt", "updatedAt")
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `,
    [
      id,
      data.name,
      data.description,
      data.price,
      data.stock,
      data.category,
      createdAt,
      updatedAt,
    ]
  );

  return {
    id,
    ...data,
    createdAt,
    updatedAt,
  };
}

export async function updateProduct(
  id: string,
  data: Partial<CreateProductInput>
): Promise<Product | null> {
  const existing = await getProductById(id);
  if (!existing) return null;

  const updatedData: Product = {
    ...existing,
    ...data,
    updatedAt: new Date().toISOString(),
  };

  await exec(
    `
    UPDATE products
    SET name = ?, description = ?, price = ?, stock = ?, category = ?, "updatedAt" = ?
    WHERE id = ?
  `,
    [
      updatedData.name,
      updatedData.description,
      updatedData.price,
      updatedData.stock,
      updatedData.category,
      updatedData.updatedAt,
      id,
    ]
  );

  return updatedData;
}

export async function deleteProduct(id: string): Promise<boolean> {
  await ensureMigrated();
  const { rowCount } = await getPool().query(preparePg('DELETE FROM products WHERE id = ?', 1), [
    id,
  ]);
  return (rowCount ?? 0) > 0;
}

function emptyToNull(s: string | null | undefined): string | null {
  if (s === undefined || s === null) return null;
  const t = s.trim();
  return t === '' ? null : t;
}

export async function getDefaultAdminProfileId(): Promise<string> {
  const row = await queryOne<{ id: string }>(
    'SELECT id FROM access_profiles WHERE name = ? LIMIT 1',
    ['Administrador']
  );
  if (!row) {
    throw new Error('Perfil Administrador não encontrado.');
  }
  return row.id;
}

export async function getAllUsers(): Promise<StoredUser[]> {
  const rows = await queryAll<Record<string, unknown>>('SELECT * FROM users');
  return rows.map((r) => rowToStoredUser(r));
}

export async function getUserById(id: string): Promise<StoredUser | null> {
  const row = await queryOne<Record<string, unknown>>('SELECT * FROM users WHERE id = ?', [id]);
  return row ? rowToStoredUser(row) : null;
}

export async function getUserByEmail(email: string): Promise<StoredUser | null> {
  const row = await queryOne<Record<string, unknown>>('SELECT * FROM users WHERE email = ?', [
    email,
  ]);
  return row ? rowToStoredUser(row) : null;
}

export async function createUser(data: InsertUserRow): Promise<StoredUser> {
  const id = Date.now().toString();
  const createdAt = new Date().toISOString();
  const updatedAt = createdAt;
  const phone = emptyToNull(data.phone);
  const avatar = emptyToNull(data.avatar);
  const bio = emptyToNull(data.bio);
  const role = data.role ?? null;
  const isActive =
    data.isActive !== undefined ? Boolean(data.isActive) : true;
  let profileId = emptyToNull(data.profile_id as string | undefined);
  if (!profileId) {
    profileId = await getDefaultAdminProfileId();
  }

  await exec(
    `
    INSERT INTO users (
      id, name, email, password_hash, phone, avatar, bio, role, "isActive", profile_id, "createdAt", "updatedAt"
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `,
    [
      id,
      data.name,
      data.email,
      data.password_hash,
      phone,
      avatar,
      bio,
      role,
      isActive,
      profileId,
      createdAt,
      updatedAt,
    ]
  );

  const created = await getUserById(id);
  if (!created) throw new Error('Failed to load user after insert');
  return created;
}

export async function updateUser(
  id: string,
  data: Partial<Omit<StoredUser, 'id' | 'createdAt'>>
): Promise<StoredUser | null> {
  const existing = await getUserById(id);
  if (!existing) return null;

  const merged: StoredUser = {
    ...existing,
    ...data,
    id: existing.id,
    createdAt: existing.createdAt,
    updatedAt: new Date().toISOString(),
  };

  const phone = emptyToNull(merged.phone ?? undefined);
  const avatar = emptyToNull(merged.avatar ?? undefined);
  const bio = emptyToNull(merged.bio ?? undefined);
  const role = merged.role ?? null;
  const isActive =
    merged.isActive !== undefined && merged.isActive !== null
      ? Boolean(merged.isActive)
      : true;

  const profileId = emptyToNull(merged.profile_id ?? undefined);

  await exec(
    `
    UPDATE users
    SET name = ?, email = ?, password_hash = ?, phone = ?, avatar = ?, bio = ?, role = ?, "isActive" = ?, profile_id = ?, "updatedAt" = ?
    WHERE id = ?
  `,
    [
      merged.name,
      merged.email,
      merged.password_hash,
      phone,
      avatar,
      bio,
      role,
      isActive,
      profileId,
      merged.updatedAt,
      id,
    ]
  );

  return getUserById(id);
}

export type UserProfileUpdate = Partial<
  Pick<StoredUser, 'name' | 'email' | 'phone' | 'avatar' | 'bio' | 'profile_id'>
> & { password_hash?: string };

/** Merge profile fields and optional new password hash; preserves role and isActive. */
export async function updateUserFromInput(
  id: string,
  data: UserProfileUpdate
): Promise<StoredUser | null> {
  const existing = await getUserById(id);
  if (!existing) return null;
  return updateUser(id, {
    name: data.name ?? existing.name,
    email: data.email ?? existing.email,
    password_hash: data.password_hash ?? existing.password_hash,
    phone:
      data.phone !== undefined ? emptyToNull(data.phone) : existing.phone,
    avatar:
      data.avatar !== undefined
        ? emptyToNull(data.avatar)
        : existing.avatar,
    bio: data.bio !== undefined ? emptyToNull(data.bio) : existing.bio,
    profile_id:
      data.profile_id !== undefined
        ? emptyToNull(data.profile_id as string)
        : existing.profile_id,
    role: existing.role,
    isActive: existing.isActive,
  });
}

export async function deleteUser(id: string): Promise<boolean> {
  await ensureMigrated();
  const { rowCount } = await getPool().query(preparePg('DELETE FROM users WHERE id = ?', 1), [id]);
  return (rowCount ?? 0) > 0;
}

export async function getAllScreens(): Promise<ScreenRow[]> {
  const rows = await queryAll<{
    key: string;
    label: string;
    sort_order: number;
  }>('SELECT key, label, sort_order FROM screens ORDER BY sort_order ASC');
  return rows.map((r) => ({
    key: r.key as ScreenKey,
    label: r.label,
    sort_order: r.sort_order,
  }));
}

export async function getAllAccessProfiles(): Promise<AccessProfileRow[]> {
  const rows = await queryAll<{
    id: string;
    name: string;
    description: string | null;
    createdAt: string;
    updatedAt: string;
  }>(
    'SELECT id, name, description, "createdAt", "updatedAt" FROM access_profiles ORDER BY name ASC'
  );
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  }));
}

export async function getPermissionMatrixForProfile(
  profileId: string
): Promise<PermissionMatrix> {
  const rows = await queryAll<{
    screen_key: string;
    can_view: boolean;
    can_add: boolean;
    can_edit: boolean;
    can_delete: boolean;
  }>(
    `SELECT screen_key, can_view, can_add, can_edit, can_delete
     FROM profile_screen_permissions WHERE profile_id = ?`,
    [profileId]
  );
  const matrix = emptyPermissionMatrix();
  for (const r of rows) {
    const key = r.screen_key as ScreenKey;
    if (!(SCREEN_KEYS as readonly string[]).includes(key)) continue;
    matrix[key] = {
      view: !!r.can_view,
      add: !!r.can_add,
      edit: !!r.can_edit,
      delete: !!r.can_delete,
    };
  }
  return matrix;
}

export async function getPermissionMatrixForUser(
  userId: string
): Promise<PermissionMatrix | null> {
  const user = await getUserById(userId);
  if (!user?.profile_id) return null;
  return getPermissionMatrixForProfile(user.profile_id);
}

export async function replaceProfilePermissions(
  profileId: string,
  rows: ProfilePermissionInput[]
): Promise<void> {
  await ensureMigrated();
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      preparePg('DELETE FROM profile_screen_permissions WHERE profile_id = ?', 1),
      [profileId]
    );
    for (const r of rows) {
      await client.query(
        preparePg(
          `INSERT INTO profile_screen_permissions
         (profile_id, screen_key, can_view, can_add, can_edit, can_delete)
         VALUES (?, ?, ?, ?, ?, ?)`,
          6
        ),
        [
          profileId,
          r.screen_key,
          r.can_view,
          r.can_add,
          r.can_edit,
          r.can_delete,
        ]
      );
    }
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

export async function createAccessProfile(
  name: string,
  description?: string | null
): Promise<AccessProfileRow> {
  const id = Date.now().toString();
  const now = new Date().toISOString();
  const desc = description === undefined ? null : emptyToNull(description);
  await exec(
    `INSERT INTO access_profiles (id, name, description, "createdAt", "updatedAt")
     VALUES (?, ?, ?, ?, ?)`,
    [id, name.trim(), desc, now, now]
  );
  const defaults: ProfilePermissionInput[] = SCREEN_KEYS.map((key: ScreenKey) => ({
    screen_key: key,
    can_view: false,
    can_add: false,
    can_edit: false,
    can_delete: false,
  }));
  await replaceProfilePermissions(id, defaults);
  const row = await queryOne<{
    id: string;
    name: string;
    description: string | null;
    createdAt: string;
    updatedAt: string;
  }>('SELECT id, name, description, "createdAt", "updatedAt" FROM access_profiles WHERE id = ?', [
    id,
  ]);
  if (!row) throw new Error('Falha ao criar perfil de acesso.');
  return row;
}

export async function deleteAccessProfile(id: string): Promise<void> {
  const usage = await queryOne<{ n: string }>(
    'SELECT COUNT(*)::text AS n FROM users WHERE profile_id = ?',
    [id]
  );
  if (usage && Number(usage.n) > 0) {
    throw new Error('Existem usuários vinculados a este perfil.');
  }
  const adminId = await getDefaultAdminProfileId();
  if (id === adminId) {
    throw new Error('Não é permitido excluir o perfil Administrador.');
  }
  await exec('DELETE FROM access_profiles WHERE id = ?', [id]);
}
