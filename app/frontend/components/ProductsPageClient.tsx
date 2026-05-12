'use client';

import type { Product } from '@/backend/types';
import ProductForm from '@/frontend/components/ProductForm';
import ProductList from '@/frontend/components/ProductList';

interface ProductsPageClientProps {
  initialProducts: Product[];
}

export default function ProductsPageClient({
  initialProducts,
}: ProductsPageClientProps) {
  return (
    <div className="py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <header className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Gerenciamento de Produtos
          </h1>
          <p className="text-gray-600">
            Cadastre novos produtos e gerencie seu inventário
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <ProductForm />
          </div>

          <div className="lg:col-span-2">
            <ProductList initialProducts={initialProducts} />
          </div>
        </div>
      </div>
    </div>
  );
}
