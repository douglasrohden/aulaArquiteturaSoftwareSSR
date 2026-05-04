import { serverGetProducts } from '@/backend/products';
import ProductsPageClient from '@/frontend/components/ProductsPageClient';

export const metadata = {
  title: 'Gerenciamento de Produtos',
  description: 'Cadastrar e gerenciar produtos',
};

export default async function ProductsPage() {
  const products = await serverGetProducts();

  return <ProductsPageClient initialProducts={products} />;
}
