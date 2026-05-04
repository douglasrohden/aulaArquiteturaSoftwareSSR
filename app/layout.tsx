import AppSidebar from '@/frontend/components/AppSidebar'; 
import '@/frontend/styles/globals.css';

export const metadata = {
  title: 'Meu App',
  description: 'Aplicação de Gerenciamento de Produtos',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt" dir="ltr">
      <body className="antialiased">
        <div className="flex min-h-screen flex-col bg-gray-50 md:flex-row">
          <AppSidebar />
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-x-auto">{children}</div>
        </div>
      </body>
    </html>
  );
}
