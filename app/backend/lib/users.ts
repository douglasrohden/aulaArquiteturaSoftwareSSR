'use server';

import {
  PublicUser,
  CreateUserInput,
  UpdateUserBody,
  toPublicUser,
} from '@/backend/types/user';
import {
  getAllUsers,
  getUserById,
  getUserByEmail,
  createUser as dbCreateUser,
  updateUserFromInput,
  type UserProfileUpdate,
} from '@/backend/db';
import { hashPassword } from '@/backend/lib/password';

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function getUsers(): Promise<PublicUser[]> {
  const rows = await getAllUsers();
  return rows.map(toPublicUser);
}

export async function getUserByIdPublic(id: string): Promise<PublicUser | null> {
  const row = await getUserById(id);
  return row ? toPublicUser(row) : null;
}

export async function getUserByEmailPublic(
  email: string
): Promise<PublicUser | null> {
  const row = await getUserByEmail(normalizeEmail(email));
  return row ? toPublicUser(row) : null;
}

export async function createUser(data: CreateUserInput): Promise<PublicUser> {
  if (!data.name || !data.name.trim()) {
    throw new Error('User name is required');
  }

  if (!data.email || !data.email.trim()) {
    throw new Error('Email is required');
  }

  if (!data.password || data.password.length < 6) {
    throw new Error('Password must be at least 6 characters long');
  }

  const email = normalizeEmail(data.email);
  const existingUser = await getUserByEmail(email);
  if (existingUser) {
    throw new Error('Email already registered');
  }

  const password_hash = await hashPassword(data.password);

  const row = await dbCreateUser({
    name: data.name.trim(),
    email,
    password_hash,
    phone: data.phone,
    avatar: data.avatar,
    bio: data.bio,
    profile_id: data.profile_id ?? undefined,
  });

  return toPublicUser(row);
}

export async function updateUser(
  id: string,
  data: UpdateUserBody
): Promise<PublicUser | null> {
  const { password, ...fields } = data;

  let password_hash: string | undefined;
  if (password !== undefined && password !== '') {
    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }
    password_hash = await hashPassword(password);
  }

  const payload: UserProfileUpdate = {};

  if (fields.name !== undefined) payload.name = fields.name.trim();
  if (fields.email !== undefined)
    payload.email = normalizeEmail(fields.email);
  if (fields.phone !== undefined) payload.phone = fields.phone;
  if (fields.avatar !== undefined) payload.avatar = fields.avatar;
  if (fields.bio !== undefined) payload.bio = fields.bio;
  if (fields.profile_id !== undefined) payload.profile_id = fields.profile_id;
  if (password_hash !== undefined) payload.password_hash = password_hash;

  const updated = await updateUserFromInput(id, payload);
  return updated ? toPublicUser(updated) : null;
}
