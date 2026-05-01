'use server';

import { User, CreateUserInput } from '@/backend/types/user';
import { getAllUsers as dbGetAllUsers, getUserById as dbGetUserById, getUserByEmail as dbGetUserByEmail, createUser as dbCreateUser, updateUser as dbUpdateUser } from '@/backend/db';

export async function getUsers(): Promise<User[]> {
  return await dbGetAllUsers();
}

export async function getUserById(id: string): Promise<User | null> {
  return await dbGetUserById(id);
}

export async function getUserByEmail(email: string): Promise<User | null> {
  return await dbGetUserByEmail(email);
}

export async function createUser(data: CreateUserInput): Promise<User> {
  // Validate input
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
  const existingUser = await dbGetUserByEmail(data.email);
  if (existingUser) {
    throw new Error('Email already registered');
  }

  return await dbCreateUser(data);
}

export async function updateUser(
  id: string,
  data: Partial<CreateUserInput>
): Promise<User | null> {
  return await dbUpdateUser(id, data);
}