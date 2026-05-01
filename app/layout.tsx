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
    <html lang="pt">
      <body>{children}</body>
    </html>
  );
}
