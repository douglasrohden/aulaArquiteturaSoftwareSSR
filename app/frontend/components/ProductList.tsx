'use client';

import { Product } from '@/backend/types';
import { useState } from 'react';

interface ProductListProps {
  initialProducts: Product[];
  onProductDeleted?: () => void;
  authHeaders?: HeadersInit;
  canDelete?: boolean;
}

export default function ProductList({
  initialProducts,
  onProductDeleted,
  authHeaders,
  canDelete = true,
}: ProductListProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [loading, setLoading] = useState(false);

  const handleDelete = async (id: string) => {
    if (!confirm('Você tem certeza que deseja excluir este produto?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/products?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: {
          ...(authHeaders as Record<string, string>),
        },
      });

      if (!response.ok) {
        throw new Error('Falha ao excluir produto');
      }

      setProducts(products.filter(p => p.id !== id));
      onProductDeleted?.();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Falha ao excluir produto');
    } finally {
      setLoading(false);
    }
  };

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">Nenhum produto registrado ainda.</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Produtos Registrados</h2>
      <div className="overflow-x-auto shadow-md rounded-lg">
        <table className="w-full bg-white">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Nome</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Categoria</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Preço</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Estoque</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Criado em</th>
              {canDelete ? (
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">
                  Ações
                </th>
              ) : null}
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
                {canDelete ? (
                  <td className="px-6 py-4 text-sm text-center">
                    <button
                      type="button"
                      onClick={() => handleDelete(product.id)}
                      disabled={loading}
                      className="text-red-500 hover:text-red-700 disabled:text-gray-400 font-semibold transition"
                    >
                      Excluir
                    </button>
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
