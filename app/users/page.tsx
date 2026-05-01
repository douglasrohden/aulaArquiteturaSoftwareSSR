'use client';

import { useState, useEffect } from 'react';
import { User } from '@/backend/types/user';
import UserProfileCard from '@/frontend/components/UserProfileCard';
import UserEditModal from '@/frontend/components/UserEditModal';
import UserDeleteModal from '@/frontend/components/UserDeleteModal';
import UserModal from '@/frontend/components/UserModal';
import styles from './page.module.css';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Carregar usuários
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/users');
        
        if (!response.ok) {
          throw new Error('Falha ao carregar usuários');
        }

        const data = await response.json();
        setUsers(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar usuários');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Deletar usuário
  const handleDelete = async (userId: string) => {
    try {
      const response = await fetch('/api/users', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: userId }),
      });

      if (!response.ok) {
        throw new Error('Falha ao deletar usuário');
      }

      setUsers(users.filter(u => u.id !== userId));
      setDeletingUserId(null);
    } catch (err) {
      throw err;
    }
  };

  // Atualizar usuário após edição
  const handleEditSuccess = () => {
    // Recarregar usuários
    fetch('/api/users')
      .then(res => res.json())
      .then(data => setUsers(data));
    setEditingUser(null);
  };

  // Atualizar usuários após criação
  const handleCreateSuccess = () => {
    fetch('/api/users')
      .then(res => res.json())
      .then(data => setUsers(data));
    setIsCreateModalOpen(false);
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Carregando usuários...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>👥 Gerenciar Usuários</h1>
        <button
          className={styles.btnCreate}
          onClick={() => setIsCreateModalOpen(true)}
        >
          + Novo Usuário
        </button>
      </div>

      {error && (
        <div className={styles.error}>{error}</div>
      )}

      {users.length === 0 ? (
        <div className={styles.empty}>
          <p>Nenhum usuário cadastrado ainda.</p>
          <button
            className={styles.btnCreate}
            onClick={() => setIsCreateModalOpen(true)}
          >
            Criar Primeiro Usuário
          </button>
        </div>
      ) : (
        <div className={styles.grid}>
          {users.map(user => (
            <UserProfileCard
              key={user.id}
              user={user}
              onEdit={() => setEditingUser(user)}
              onDelete={() => setDeletingUserId(user.id)}
            />
          ))}
        </div>
      )}

      {/* Modais */}
      <UserModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />

      {editingUser && (
        <UserEditModal
          isOpen={true}
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSuccess={handleEditSuccess}
        />
      )}

      {deletingUserId && (
        <UserDeleteModal
          isOpen={true}
          userName={users.find(u => u.id === deletingUserId)?.name || 'Usuário'}
          onConfirm={() => handleDelete(deletingUserId)}
          onCancel={() => setDeletingUserId(null)}
        />
      )}
    </div>
  );
}