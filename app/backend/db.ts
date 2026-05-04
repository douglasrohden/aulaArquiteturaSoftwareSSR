// Server-side database initialization and connection
import sqlite3 from 'sqlite3';
import path from 'path';
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

const DATA_DIR = path.join(process.cwd(), '.data');
const DB_PATH = path.join(DATA_DIR, 'products.db');

let db: sqlite3.Database;

function exec(sql: string, params: unknown[] = []): Promise<void> {
  return new Promise((resolve, reject) => {
    db.run(sql, params, (err) => (err ? reject(err) : resolve()));
  });
}

function queryAll<T>(sql: string, params: unknown[] = []): Promise<T[]> {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) =>
      err ? reject(err) : resolve(rows as T[])
    );
  });
}

function queryOne<T>(sql: string, params: unknown[] = []): Promise<T | null> {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) =>
      err ? reject(err) : resolve((row as T) ?? null)
    );
  });
}

function rowToStoredUser(row: Record<string, unknown>): StoredUser {
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
    isActive:
      row.isActive === null || row.isActive === undefined
        ? true
        : Number(row.isActive) === 1,
    profile_id:
      row.profile_id !== undefined && row.profile_id !== null
        ? String(row.profile_id)
        : null,
    createdAt: String(row.createdAt),
    updatedAt: String(row.updatedAt),
  };
}

async function migrateUsersTable(): Promise<void> {
  let cols = await queryAll<{ name: string }>('PRAGMA table_info(users)');
  if (cols.length === 0) {
    return;
  }

  let names = new Set(cols.map((c) => c.name));

  if (names.has('password') && !names.has('password_hash')) {
    await exec('ALTER TABLE users RENAME COLUMN password TO password_hash');
    cols = await queryAll<{ name: string }>('PRAGMA table_info(users)');
    names = new Set(cols.map((c) => c.name));
  }

  const addColumn = async (columnName: string, columnDef: string) => {
    if (!names.has(columnName)) {
      await exec(`ALTER TABLE users ADD COLUMN ${columnName} ${columnDef}`);
    }
  };

  await addColumn('phone', 'TEXT');
  await addColumn('avatar', 'TEXT');
  await addColumn('bio', 'TEXT');
  await addColumn('role', 'TEXT');
  await addColumn('isActive', 'INTEGER NOT NULL DEFAULT 1');
}

async function migrateAccessControl(): Promise<void> {
  await exec(`
    CREATE TABLE IF NOT EXISTS screens (
      key TEXT PRIMARY KEY,
      label TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0
    )
  `);

  await exec(`
    CREATE TABLE IF NOT EXISTS access_profiles (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )
  `);

  await exec(`
    CREATE TABLE IF NOT EXISTS profile_screen_permissions (
      profile_id TEXT NOT NULL,
      screen_key TEXT NOT NULL,
      can_view INTEGER NOT NULL DEFAULT 0,
      can_add INTEGER NOT NULL DEFAULT 0,
      can_edit INTEGER NOT NULL DEFAULT 0,
      can_delete INTEGER NOT NULL DEFAULT 0,
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
    await exec(
      `INSERT OR IGNORE INTO screens (key, label, sort_order) VALUES (?, ?, ?)`,
      [key, label, sort_order]
    );
  }

  const userCols = await queryAll<{ name: string }>('PRAGMA table_info(users)');
  const userNames = new Set(userCols.map((c) => c.name));
  if (!userNames.has('profile_id')) {
    await exec(
      'ALTER TABLE users ADD COLUMN profile_id TEXT REFERENCES access_profiles(id) ON DELETE SET NULL'
    );
  }

  const now = new Date().toISOString();

  let adminRow = await queryOne<{ id: string }>(
    'SELECT id FROM access_profiles WHERE name = ? LIMIT 1',
    ['Administrador']
  );
  let adminProfileId: string;
  if (!adminRow) {
    adminProfileId = Date.now().toString();
    await exec(
      `INSERT INTO access_profiles (id, name, description, createdAt, updatedAt)
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
      await exec(
        `INSERT OR IGNORE INTO profile_screen_permissions
         (profile_id, screen_key, can_view, can_add, can_edit, can_delete)
         VALUES (?, ?, 1, 1, 1, 1)`,
        [adminProfileId, key]
      );
    }
  } else {
    adminProfileId = adminRow.id;
    for (const key of SCREEN_KEYS) {
      await exec(
        `INSERT OR IGNORE INTO profile_screen_permissions
         (profile_id, screen_key, can_view, can_add, can_edit, can_delete)
         VALUES (?, ?, 1, 1, 1, 1)`,
        [adminProfileId, key]
      );
    }
  }

  let readerRow = await queryOne<{ id: string }>(
    'SELECT id FROM access_profiles WHERE name = ? LIMIT 1',
    ['Leitor']
  );
  if (!readerRow) {
    const readerId = (Date.now() + 1).toString();
    await exec(
      `INSERT INTO access_profiles (id, name, description, createdAt, updatedAt)
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
      await exec(
        `INSERT INTO profile_screen_permissions
         (profile_id, screen_key, can_view, can_add, can_edit, can_delete)
         VALUES (?, ?, 1, 0, 0, 0)`,
        [readerId, key]
      );
    }
  }

  await exec('UPDATE users SET profile_id = ? WHERE profile_id IS NULL', [
    adminProfileId,
  ]);
}

async function runMigrations(): Promise<void> {
  await exec(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      stock INTEGER NOT NULL,
      category TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )
  `);

  await exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      phone TEXT,
      avatar TEXT,
      bio TEXT,
      role TEXT,
      isActive INTEGER NOT NULL DEFAULT 1,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )
  `);

  await migrateUsersTable();
  await migrateAccessControl();
}

export function initDatabase(): Promise<void> {
  return new Promise((resolve, reject) => {
    require('fs').mkdirSync(DATA_DIR, { recursive: true });

    db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('Error opening database:', err);
        reject(err);
        return;
      }
      db.run('PRAGMA foreign_keys = ON');
      runMigrations()
        .then(resolve)
        .catch((e) => {
          console.error('Migration error:', e);
          reject(e);
        });
    });
  });
}

initDatabase().catch(console.error);

export function getAllProducts(): Promise<Product[]> {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM products', (err, rows: Product[]) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

export function getProductById(id: string): Promise<Product | null> {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM products WHERE id = ?', [id], (err, row: Product) => {
      if (err) {
        reject(err);
      } else {
        resolve(row || null);
      }
    });
  });
}

export function createProduct(data: CreateProductInput): Promise<Product> {
  return new Promise((resolve, reject) => {
    const id = Date.now().toString();
    const createdAt = new Date().toISOString();
    const updatedAt = createdAt;

    db.run(
      `
      INSERT INTO products (id, name, description, price, stock, category, createdAt, updatedAt)
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
      ],
      function (err) {
        if (err) {
          reject(err);
        } else {
          resolve({
            id,
            ...data,
            createdAt,
            updatedAt,
          });
        }
      }
    );
  });
}

export function updateProduct(
  id: string,
  data: Partial<CreateProductInput>
): Promise<Product | null> {
  return new Promise(async (resolve, reject) => {
    try {
      const existing = await getProductById(id);
      if (!existing) {
        resolve(null);
        return;
      }

      const updatedData = {
        ...existing,
        ...data,
        updatedAt: new Date().toISOString(),
      };

      db.run(
        `
        UPDATE products
        SET name = ?, description = ?, price = ?, stock = ?, category = ?, updatedAt = ?
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
        ],
        function (err) {
          if (err) {
            reject(err);
          } else {
            resolve(updatedData);
          }
        }
      );
    } catch (err) {
      reject(err);
    }
  });
}

export function deleteProduct(id: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    db.run('DELETE FROM products WHERE id = ?', [id], function (err) {
      if (err) {
        reject(err);
      } else {
        resolve(this.changes > 0);
      }
    });
  });
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

export function getAllUsers(): Promise<StoredUser[]> {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM users', (err, rows: Record<string, unknown>[]) => {
      if (err) {
        reject(err);
      } else {
        resolve((rows || []).map((r) => rowToStoredUser(r)));
      }
    });
  });
}

export function getUserById(id: string): Promise<StoredUser | null> {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT * FROM users WHERE id = ?',
      [id],
      (err, row: Record<string, unknown>) => {
        if (err) {
          reject(err);
        } else {
          resolve(row ? rowToStoredUser(row) : null);
        }
      }
    );
  });
}

export function getUserByEmail(email: string): Promise<StoredUser | null> {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT * FROM users WHERE email = ?',
      [email],
      (err, row: Record<string, unknown>) => {
        if (err) {
          reject(err);
        } else {
          resolve(row ? rowToStoredUser(row) : null);
        }
      }
    );
  });
}

export function createUser(data: InsertUserRow): Promise<StoredUser> {
  return (async () => {
    const id = Date.now().toString();
    const createdAt = new Date().toISOString();
    const updatedAt = createdAt;
    const phone = emptyToNull(data.phone);
    const avatar = emptyToNull(data.avatar);
    const bio = emptyToNull(data.bio);
    const role = data.role ?? null;
    const isActive = data.isActive !== undefined ? (data.isActive ? 1 : 0) : 1;
    let profileId = emptyToNull(data.profile_id as string | undefined);
    if (!profileId) {
      profileId = await getDefaultAdminProfileId();
    }

    await new Promise<void>((resolve, reject) => {
      db.run(
        `
        INSERT INTO users (
          id, name, email, password_hash, phone, avatar, bio, role, isActive, profile_id, createdAt, updatedAt
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
        ],
        (err) => (err ? reject(err) : resolve())
      );
    });

    const created = await getUserById(id);
    if (!created) throw new Error('Failed to load user after insert');
    return created;
  })();
}

export function updateUser(
  id: string,
  data: Partial<Omit<StoredUser, 'id' | 'createdAt'>>
): Promise<StoredUser | null> {
  return new Promise(async (resolve, reject) => {
    try {
      const existing = await getUserById(id);
      if (!existing) {
        resolve(null);
        return;
      }

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
      const isActive = merged.isActive !== undefined && merged.isActive !== null
        ? merged.isActive
          ? 1
          : 0
        : 1;

      const profileId = emptyToNull(merged.profile_id ?? undefined);

      db.run(
        `
        UPDATE users
        SET name = ?, email = ?, password_hash = ?, phone = ?, avatar = ?, bio = ?, role = ?, isActive = ?, profile_id = ?, updatedAt = ?
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
        ],
        function (err) {
          if (err) {
            reject(err);
            return;
          }
          getUserById(id).then(resolve).catch(reject);
        }
      );
    } catch (err) {
      reject(err);
    }
  });
}

export type UserProfileUpdate = Partial<
  Pick<StoredUser, 'name' | 'email' | 'phone' | 'avatar' | 'bio' | 'profile_id'>
> & { password_hash?: string };

/** Merge profile fields and optional new password hash; preserves role and isActive. */
export function updateUserFromInput(
  id: string,
  data: UserProfileUpdate
): Promise<StoredUser | null> {
  return getUserById(id).then((existing) => {
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
  });
}

export function deleteUser(id: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    db.run('DELETE FROM users WHERE id = ?', [id], function (err) {
      if (err) {
        reject(err);
      } else {
        resolve(this.changes > 0);
      }
    });
  });
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
    'SELECT id, name, description, createdAt, updatedAt FROM access_profiles ORDER BY name ASC'
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
    can_view: number;
    can_add: number;
    can_edit: number;
    can_delete: number;
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
  await exec('BEGIN IMMEDIATE');
  try {
    await exec('DELETE FROM profile_screen_permissions WHERE profile_id = ?', [
      profileId,
    ]);
    for (const r of rows) {
      await exec(
        `INSERT INTO profile_screen_permissions
         (profile_id, screen_key, can_view, can_add, can_edit, can_delete)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          profileId,
          r.screen_key,
          r.can_view ? 1 : 0,
          r.can_add ? 1 : 0,
          r.can_edit ? 1 : 0,
          r.can_delete ? 1 : 0,
        ]
      );
    }
    await exec('COMMIT');
  } catch (e) {
    await exec('ROLLBACK');
    throw e;
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
    `INSERT INTO access_profiles (id, name, description, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?)`,
    [id, name.trim(), desc, now, now]
  );
  const defaults: ProfilePermissionInput[] = SCREEN_KEYS.map((key) => ({
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
  }>('SELECT id, name, description, createdAt, updatedAt FROM access_profiles WHERE id = ?', [
    id,
  ]);
  if (!row) throw new Error('Falha ao criar perfil de acesso.');
  return row;
}

export async function deleteAccessProfile(id: string): Promise<void> {
  const usage = await queryOne<{ n: number }>(
    'SELECT COUNT(*) AS n FROM users WHERE profile_id = ?',
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
