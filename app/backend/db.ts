// Server-side database initialization and connection
import sqlite3 from 'sqlite3';
import path from 'path';
import { Product, CreateProductInput } from './types';
import { User, CreateUserInput } from './types/user';

// SQLite database setup
const DATA_DIR = path.join(process.cwd(), '.data');
const DB_PATH = path.join(DATA_DIR, 'products.db');

let db: sqlite3.Database;

export function initDatabase(): Promise<void> {
  return new Promise((resolve, reject) => {
    // Ensure data directory exists
    require('fs').mkdirSync(DATA_DIR, { recursive: true });

    db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('Error opening database:', err);
        reject(err);
        return;
      }

      // Create products table if it doesn't exist
      db.run(`
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
      `, (err) => {
        if (err) {
          console.error('Error creating products table:', err);
          reject(err);
          return;
        }

        // Create users table if it doesn't exist
        db.run(`
          CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            createdAt TEXT NOT NULL,
            updatedAt TEXT NOT NULL
          )
        `, (err) => {
          if (err) {
            console.error('Error creating users table:', err);
            reject(err);
          } else {
            resolve();
          }
        });
      });
    });
  });
}

// Initialize database on module load
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

    db.run(`
      INSERT INTO products (id, name, description, price, stock, category, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [id, data.name, data.description, data.price, data.stock, data.category, createdAt, updatedAt], function(err) {
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
    });
  });
}

export function updateProduct(id: string, data: Partial<CreateProductInput>): Promise<Product | null> {
  return new Promise(async (resolve, reject) => {
    try {
      const existing = await getProductById(id);
      if (!existing) {
        resolve(null);
        return;
      }

      const updatedData = { ...existing, ...data, updatedAt: new Date().toISOString() };

      db.run(`
        UPDATE products
        SET name = ?, description = ?, price = ?, stock = ?, category = ?, updatedAt = ?
        WHERE id = ?
      `, [
        updatedData.name,
        updatedData.description,
        updatedData.price,
        updatedData.stock,
        updatedData.category,
        updatedData.updatedAt,
        id
      ], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(updatedData);
        }
      });
    } catch (err) {
      reject(err);
    }
  });
}

export function deleteProduct(id: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    db.run('DELETE FROM products WHERE id = ?', [id], function(err) {
      if (err) {
        reject(err);
      } else {
        resolve(this.changes > 0);
      }
    });
  });
}

export function getAllUsers(): Promise<User[]> {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM users', (err, rows: User[]) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

export function getUserById(id: string): Promise<User | null> {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM users WHERE id = ?', [id], (err, row: User) => {
      if (err) {
        reject(err);
      } else {
        resolve(row || null);
      }
    });
  });
}

export function getUserByEmail(email: string): Promise<User | null> {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM users WHERE email = ?', [email], (err, row: User) => {
      if (err) {
        reject(err);
      } else {
        resolve(row || null);
      }
    });
  });
}

export function createUser(data: CreateUserInput): Promise<User> {
  return new Promise((resolve, reject) => {
    const id = Date.now().toString();
    const createdAt = new Date().toISOString();
    const updatedAt = createdAt;

    db.run(`
      INSERT INTO users (id, name, email, password, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [id, data.name, data.email, data.password, createdAt, updatedAt], function(err) {
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
    });
  });
}

export function updateUser(id: string, data: Partial<CreateUserInput>): Promise<User | null> {
  return new Promise(async (resolve, reject) => {
    try {
      const existing = await getUserById(id);
      if (!existing) {
        resolve(null);
        return;
      }

      const updatedData = { ...existing, ...data, updatedAt: new Date().toISOString() };

      db.run(`
        UPDATE users
        SET name = ?, email = ?, password = ?, updatedAt = ?
        WHERE id = ?
      `, [
        updatedData.name,
        updatedData.email,
        updatedData.password,
        updatedData.updatedAt,
        id
      ], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(updatedData);
        }
      });
    } catch (err) {
      reject(err);
    }
  });
}

export function deleteUser(id: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    db.run('DELETE FROM users WHERE id = ?', [id], function(err) {
      if (err) {
        reject(err);
      } else {
        resolve(this.changes > 0);
      }
    });
  });
}
