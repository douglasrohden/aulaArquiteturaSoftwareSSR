'use client';

import { User } from '@/backend/types/user';
import styles from './UserProfileCard.module.css';

interface UserProfileCardProps {
  user: User;
  onEdit?: () => void;
  onDelete?: () => void;
  isDetailView?: boolean;
}

export default function UserProfileCard({
  user,
  onEdit,
  onDelete,
  isDetailView = false,
}: UserProfileCardProps) {
  return (
    <div className={`${styles.card} ${isDetailView ? styles.detailed : ''}`}>
      <div className={styles.header}>
        {user.avatar ? (
          <img src={user.avatar} alt={user.name} className={styles.avatar} />
        ) : (
          <div className={styles.avatarPlaceholder}>
            {user.name.charAt(0).toUpperCase()}
          </div>
        )}
        <div className={styles.headerInfo}>
          <h3>{user.name}</h3>
          {user.role && <span className={styles.role}>{user.role}</span>}
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.field}>
          <label>Email:</label>
          <p>{user.email}</p>
        </div>

        {user.phone && (
          <div className={styles.field}>
            <label>Telefone:</label>
            <p>{user.phone}</p>
          </div>
        )}

        {user.bio && (
          <div className={styles.field}>
            <label>Bio:</label>
            <p>{user.bio}</p>
          </div>
        )}

        <div className={styles.field}>
          <label>Data de Cadastro:</label>
          <p>{new Date(user.createdAt).toLocaleDateString('pt-BR')}</p>
        </div>

        {isDetailView && (
          <div className={styles.field}>
            <label>Última Atualização:</label>
            <p>{new Date(user.updatedAt).toLocaleDateString('pt-BR')}</p>
          </div>
        )}

        {user.isActive !== undefined && (
          <div className={styles.field}>
            <label>Status:</label>
            <p className={user.isActive ? styles.active : styles.inactive}>
              {user.isActive ? 'Ativo' : 'Inativo'}
            </p>
          </div>
        )}
      </div>

      {(onEdit || onDelete) && (
        <div className={styles.actions}>
          {onEdit && (
            <button className={styles.btnEdit} onClick={onEdit}>
              ✏️ Editar
            </button>
          )}
          {onDelete && (
            <button className={styles.btnDelete} onClick={onDelete}>
              🗑️ Deletar
            </button>
          )}
        </div>
      )}
    </div>
  );
}
