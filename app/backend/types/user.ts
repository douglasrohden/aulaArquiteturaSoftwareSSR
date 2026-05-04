/** Row as stored in SQLite (includes secret hash — never send to client). */
export interface StoredUser {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  phone?: string | null;
  avatar?: string | null;
  bio?: string | null;
  role?: 'admin' | 'user' | null;
  isActive?: boolean | null;
  /** FK para `access_profiles.id`. */
  profile_id?: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Safe shape for API and frontend (no password material). */
export type PublicUser = Omit<StoredUser, 'password_hash'>;

/** Alias for UI code — same as PublicUser. */
export type User = PublicUser;

/** Payload when inserting into DB (plain password already hashed). */
export type InsertUserRow = Omit<CreateUserInput, 'password'> & {
  password_hash: string;
  role?: 'admin' | 'user' | null;
  isActive?: boolean;
  profile_id?: string | null;
};

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  phone?: string;
  avatar?: string;
  bio?: string;
  profile_id?: string | null;
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  phone?: string;
  avatar?: string;
  bio?: string;
  profile_id?: string | null;
}

/** PUT body may include optional new password. */
export type UpdateUserBody = Partial<Omit<CreateUserInput, 'password'>> & {
  password?: string;
  profile_id?: string | null;
};

export function toPublicUser(row: StoredUser): PublicUser {
  const { password_hash: _removed, ...rest } = row;
  return rest;
}
