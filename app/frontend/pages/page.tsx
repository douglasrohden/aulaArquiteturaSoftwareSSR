export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Meu App</h1>
            </div>
            <div className="flex items-center gap-4">
              <a href="/" className="text-gray-700 hover:text-gray-900 font-medium">
                Início
              </a>
              <a href="/products" className="text-gray-700 hover:text-gray-900 font-medium">
                Produtos
              </a>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-12">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Bem-vindo ao Gerenciamento de Produtos
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Gerencie seu inventário de produtos com facilidade usando nossa aplicação Next.js SSR.
          </p>
          <div className="flex gap-4 justify-center">
            <a
              href="/products"
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-8 rounded-lg transition duration-200"
            >
              PEDidos
            </a>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-bold text-gray-900 mb-2">✅ Registro de Produtos</h3>
              <p className="text-gray-600">
                Registre novos produtos com informações detalhadas incluindo nome, descrição, preço, estoque e categoria.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-bold text-gray-900 mb-2">📊 Gerenciamento de Inventário</h3>
              <p className="text-gray-600">
                Mantenha o controle do seu inventário de produtos com atualizações em tempo real de estoque e gerenciamento.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-bold text-gray-900 mb-2">⚡ Renderização no Lado do Servidor</h3>
              <p className="text-gray-600">
                Construído com Next.js SSR para desempenho ideal, SEO e lógica no servidor.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
