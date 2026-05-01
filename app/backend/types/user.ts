export interface User {
  id: string;
  name: string;
  email: string;
  password: string; // In production, this should be hashed
  phone?: string;
  avatar?: string;
  bio?: string;
  role?: 'admin' | 'user';
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  phone?: string;
  avatar?: string;
  bio?: string;
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  phone?: string;
  avatar?: string;
  bio?: string;
}