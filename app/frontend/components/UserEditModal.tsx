'use client';

import { User } from '@/backend/types/user';
import UserProfileEdit from './UserProfileEdit';
import styles from './UserEditModal.module.css';

interface UserEditModalProps {
  isOpen: boolean;
  user: User;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function UserEditModal({
  isOpen,
  user,
  onClose,
  onSuccess,
}: UserEditModalProps) {
  if (!isOpen) return null;

  const handleSuccess = () => {
    onSuccess?.();
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Editar Perfil: {user.name}</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>

        <div className={styles.body}>
          <UserProfileEdit
            user={user}
            onSuccess={handleSuccess}
            onCancel={onClose}
          />
        </div>
      </div>
    </div>
  );
}
