// Server-side database initialization and connection
import { promises as fs } from 'fs';
import path from 'path';

// Using JSON file as database for simplicity (no external dependencies)
const DATA_DIR = path.join(process.cwd(), '.data');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');

export async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (error) {
    console.error('Error creating data directory:', error);
  }
}

export async function readFromDatabase<T>(file: string): Promise<T[]> {
  try {
    await ensureDataDir();
    const filePath = path.join(DATA_DIR, file);
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

export async function writeToDatabase<T>(file: string, data: T[]): Promise<void> {
  await ensureDataDir();
  const filePath = path.join(DATA_DIR, file);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

export const DATABASE = {
  PRODUCTS_FILE: 'products.json',
};
