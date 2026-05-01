'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@/backend/types/user';
import UserProfileCard from '@/frontend/components/UserProfileCard';
import UserEditModal from '@/frontend/components/UserEditModal';
import UserDeleteModal from '@/frontend/components/UserDeleteModal';
import styles from './page.module.css';

interface UserProfilePageProps {
  params: {
    id: string;
  };
}

export default function UserProfilePage({ params }: UserProfilePageProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditingModalOpen, setIsEditingModalOpen] = useState(false);
  const [isDeletingModalOpen, setIsDeletingModalOpen] = useState(false);

  // Carregar usuário
  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/users');
        
        if (!response.ok) {
          throw new Error('Falha ao carregar usuários');
        }

        const users: User[] = await response.json();
        const foundUser = users.find(u => u.id === params.id);

        if (!foundUser) {
          throw new Error('Usuário não encontrado');
        }

        setUser(foundUser);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar usuário');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [params.id]);

  // Deletar usuário
  const handleDelete = async () => {
    if (!user) return;

    try {
      const response = await fetch('/api/users', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: user.id }),
      });

      if (!response.ok) {
        throw new Error('Falha ao deletar usuário');
      }

      // Redirecionar para lista de usuários
      router.push('/users');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao deletar');
    }
  };

  // Atualizar perfil após edição
  const handleEditSuccess = () => {
    // Recarregar usuário
    fetch('/api/users')
      .then(res => res.json())
      .then((users: User[]) => {
        const updated = users.find(u => u.id === params.id);
        if (updated) setUser(updated);
      });
    setIsEditingModalOpen(false);
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Carregando perfil...</div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <p>{error || 'Usuário não encontrado'}</p>
          <button className={styles.btnBack} onClick={() => router.push('/users')}>
            ← Voltar para Lista
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.btnBack} onClick={() => router.push('/users')}>
          ← Voltar
        </button>
        <h1>Perfil do Usuário</h1>
      </div>

      <UserProfileCard
        user={user}
        isDetailView={true}
        onEdit={() => setIsEditingModalOpen(true)}
        onDelete={() => setIsDeletingModalOpen(true)}
      />

      {/* Modais */}
      {isEditingModalOpen && (
        <UserEditModal
          isOpen={true}
          user={user}
          onClose={() => setIsEditingModalOpen(false)}
          onSuccess={handleEditSuccess}
        />
      )}

      {isDeletingModalOpen && (
        <UserDeleteModal
          isOpen={true}
          userName={user.name}
          onConfirm={handleDelete}
          onCancel={() => setIsDeletingModalOpen(false)}
        />
      )}
    </div>
  );
}
