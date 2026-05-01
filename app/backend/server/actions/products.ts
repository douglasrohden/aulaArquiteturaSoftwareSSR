'use server';

import { Product, CreateProductInput } from '@/backend/types';
import { getAllProducts, getProductById, createProduct, updateProduct, deleteProduct } from '@/backend/db';

export async function serverGetProducts(): Promise<Product[]> {
  return await getAllProducts();
}

export async function serverGetProductById(id: string): Promise<Product | null> {
  return await getProductById(id);
}

export async function serverCreateProduct(data: CreateProductInput): Promise<Product> {
  const products = await getAllProducts();
  
  // Validation on server side
  if (!data.name || !data.name.trim()) {
    throw new Error('Product name is required');
  }
  
  if (data.price < 0) {
    throw new Error('Price must be a positive number');
  }
  
  if (data.stock < 0) {
    throw new Error('Stock must be a positive number');
  }

  return await createProduct({
    name: data.name.trim(),
    description: data.description.trim(),
    price: Number(data.price),
    stock: Number(data.stock),
    category: data.category.trim(),
  });
}

export async function serverUpdateProduct(
  id: string,
  data: Partial<CreateProductInput>
): Promise<Product | null> {
  // Validation
  if (data.price !== undefined && data.price < 0) {
    throw new Error('Price must be a positive number');
  }
  
  if (data.stock !== undefined && data.stock < 0) {
    throw new Error('Stock must be a positive number');
  }

  const trimmedData = {
    ...data,
    name: data.name?.trim(),
    description: data.description?.trim(),
    category: data.category?.trim(),
  };

  return await updateProduct(id, trimmedData);
}

export async function serverDeleteProduct(id: string): Promise<boolean> {
  return await deleteProduct(id);
}
