'use server';

// SERVER ACTION - Runs only on the server
import { User, CreateUserInput } from '@/backend/types/user';
import { getAllUsers, getUserById, getUserByEmail, createUser, updateUser, deleteUser } from '@/backend/db';

export async function serverGetUsers(): Promise<User[]> {
  return await getAllUsers();
}

export async function serverGetUserById(id: string): Promise<User | null> {
  return await getUserById(id);
}

export async function serverGetUserByEmail(email: string): Promise<User | null> {
  return await getUserByEmail(email);
}

export async function serverCreateUser(data: CreateUserInput): Promise<User> {
  // Validation on server side
  if (!data.name || !data.name.trim()) {
    throw new Error('User name is required');
  }
  
  if (!data.email || !data.email.trim()) {
    throw new Error('Email is required');
  }
  
  if (!data.password || data.password.length < 6) {
    throw new Error('Password must be at least 6 characters long');
  }

  // Check if email already exists
  const existingUser = await getUserByEmail(data.email);
  if (existingUser) {
    throw new Error('Email already registered');
  }

  return await createUser(data);
}

export async function serverUpdateUser(
  id: string,
  data: Partial<CreateUserInput>
): Promise<User | null> {
  return await updateUser(id, data);
}

export async function serverDeleteUser(id: string): Promise<boolean> {
  return await deleteUser(id);
}