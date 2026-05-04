'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

const navItems = [
  { href: '/', label: 'Início' },
  { href: '/products', label: 'Produtos' },
  { href: '/users', label: 'Usuários' },
];

function isActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function AppSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const close = () => setOpen(false);

  return (
    <div className="md:flex md:h-screen md:w-64 md:shrink-0 md:flex-col">
      <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-gray-200 bg-white px-4 md:hidden">
        <button
          type="button"
          aria-expanded={open}
          aria-label={open ? 'Fechar menu' : 'Abrir menu'}
          className="rounded-lg p-2 text-gray-600 hover:bg-gray-100"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
        <Link href="/" className="text-lg font-bold text-gray-900" onClick={close}>
          Meu App
        </Link>
      </header>

      {open ? (
        <button
          type="button"
          aria-label="Fechar menu"
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={close}
        />
      ) : null}

      <aside
        className={`fixed bottom-0 left-0 top-14 z-50 flex w-64 max-w-[85vw] flex-col border-r border-gray-200 bg-white transition-transform duration-200 ease-out md:static md:top-auto md:z-0 md:h-full md:max-w-none md:min-h-0 md:flex-1 md:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="flex h-full flex-col overflow-y-auto px-3 pb-6 pt-5">
          <Link href="/" className="mb-6 hidden px-2 md:block" onClick={close}>
            <span className="text-xl font-bold text-gray-900">Meu App</span>
          </Link>
          <nav className="flex flex-col gap-1" aria-label="Principal">
            {navItems.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={close}
                  className={`rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    active
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>
    </div>
  );
}
