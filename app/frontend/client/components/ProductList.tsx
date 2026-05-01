'use client';

// CLIENT COMPONENT - Runs on the browser
import { Product } from '@/backend/types';
import { useState } from 'react';
import { serverDeleteProduct } from '@/backend/products';

interface ProductListProps {
  initialProducts: Product[];
  onProductDeleted?: () => void;
}

export default function ProductList({ initialProducts, onProductDeleted }: ProductListProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [loading, setLoading] = useState(false);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) {
      return;
    }

    setLoading(true);
    try {
      // Call server action directly from client
      const success = await serverDeleteProduct(id);

      if (!success) {
        throw new Error('Failed to delete product');
      }

      setProducts(products.filter(p => p.id !== id));
      onProductDeleted?.();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to delete product');
    } finally {
      setLoading(false);
    }
  };

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">No products registered yet.</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Registered Products</h2>
      <div className="overflow-x-auto shadow-md rounded-lg">
        <table className="w-full bg-white">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Category</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Price</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Stock</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Created At</th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="border-b hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-800">
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-gray-500 text-xs">{product.description}</p>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-semibold">
                    {product.category}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm font-medium text-gray-800">
                  ${product.price.toFixed(2)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  <span className={product.stock > 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                    {product.stock}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {new Date(product.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-sm text-center">
                  <button
                    onClick={() => handleDelete(product.id)}
                    disabled={loading}
                    className="text-red-500 hover:text-red-700 disabled:text-gray-400 font-semibold transition"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
