import { serverGetProducts } from '@/backend/products';
import ProductForm from '@/frontend/components/ProductForm';
import ProductList from '@/frontend/components/ProductList';

export const metadata = {
  title: 'Gerenciamento de Produtos',
  description: 'Cadastrar e gerenciar produtos',
};

export default async function ProductsPage() {
  const products = await serverGetProducts();

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <header className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Gerenciamento de Produtos</h1>
          <p className="text-gray-600">Cadastre novos produtos e gerencie seu inventário</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <ProductForm />
          </div>

          <div className="lg:col-span-2">
            <ProductList initialProducts={products} />
          </div>
        </div>
      </div>
    </div>
  );
}
