export default function Home() {
  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-12">
      <div className="text-center">
        <h2 className="mb-4 text-4xl font-bold text-gray-900">
          Bem-vindo ao Gerenciamento de Clientes
        </h2>
        <a
          href="/products"
          className="rounded-lg bg-blue-500 px-8 py-3 font-bold text-white transition duration-200 hover:bg-blue-600"
        >
          Cliente
        </a>
        <p className="mb-8 text-xl text-gray-600">
          Gerencie seu inventário de produtos com facilidade usando nossa aplicação Next.js SSR.
        </p>

        <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="rounded-lg bg-white p-6 shadow-md">
            <h3 className="mb-2 text-xl font-bold text-gray-900">✅ Registro de Produtos</h3>
            <p className="text-gray-600">
              Registre novos produtos com informações detalhadas incluindo nome, descrição, preço,
              estoque e categoria.
            </p>
          </div>

          <div className="rounded-lg bg-white p-6 shadow-md">
            <h3 className="mb-2 text-xl font-bold text-gray-900">📊 Gerenciamento de Inventário</h3>
            <p className="text-gray-600">
              Mantenha o controle do seu inventário de produtos com atualizações em tempo real de
              estoque e gerenciamento.
            </p>
          </div>

          <div className="rounded-lg bg-white p-6 shadow-md">
            <h3 className="mb-2 text-xl font-bold text-gray-900">⚡ Renderização no Lado do Servidor</h3>
            <p className="text-gray-600">
              Construído com Next.js SSR para desempenho ideal, SEO e lógica no servidor.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
