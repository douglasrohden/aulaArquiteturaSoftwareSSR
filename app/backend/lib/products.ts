'use server';

import { Product, CreateProductInput } from '@/app/types/product';
import { promises as fs } from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), '.data');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');

async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (error) {
    console.error('Error creating data directory:', error);
  }
}

async function readProducts(): Promise<Product[]> {
  try {
    await ensureDataDir();
    const data = await fs.readFile(PRODUCTS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // If file doesn't exist, return empty array
    return [];
  }
}

async function writeProducts(products: Product[]): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(PRODUCTS_FILE, JSON.stringify(products, null, 2));
}

export async function getProducts(): Promise<Product[]> {
  return readProducts();
}

export async function getProductById(id: string): Promise<Product | null> {
  const products = await readProducts();
  return products.find(p => p.id === id) || null;
}

export async function createProduct(data: CreateProductInput): Promise<Product> {
  const products = await readProducts();
  
  // Validate input
  if (!data.name || !data.name.trim()) {
    throw new Error('Product name is required');
  }
  
  if (data.price < 0) {
    throw new Error('Price must be a positive number');
  }
  
  if (data.stock < 0) {
    throw new Error('Stock must be a positive number');
  }

  const newProduct: Product = {
    id: Date.now().toString(),
    name: data.name.trim(),
    description: data.description.trim(),
    price: Number(data.price),
    stock: Number(data.stock),
    category: data.category.trim(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  products.push(newProduct);
  await writeProducts(products);

  return newProduct;
}

export async function updateProduct(
  id: string,
  data: Partial<CreateProductInput>
): Promise<Product | null> {
  const products = await readProducts();
  const index = products.findIndex(p => p.id === id);

  if (index === -1) {
    return null;
  }

  const product = products[index];
  const updated: Product = {
    ...product,
    ...data,
    id: product.id,
    createdAt: product.createdAt,
    updatedAt: new Date().toISOString(),
  };

  products[index] = updated;
  await writeProducts(products);

  return updated;
}

export async function deleteProduct(id: string): Promise<boolean> {
  const products = await readProducts();
  const filtered = products.filter(p => p.id !== id);

  if (filtered.length === products.length) {
    return false;
  }

  await writeProducts(filtered);
  return true;
}
