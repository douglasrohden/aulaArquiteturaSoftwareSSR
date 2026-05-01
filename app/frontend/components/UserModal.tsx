'use client';

import { useState } from 'react';
import UserForm from './UserForm';
import styles from './UserModal.module.css';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function UserModal({ isOpen, onClose, onSuccess }: UserModalProps) {
  if (!isOpen) return null;

  const handleSuccess = () => {
    onSuccess?.();
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Novo Usuário</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>

        <div className={styles.body}>
          <UserForm onSuccess={handleSuccess} />
        </div>
      </div>
    </div>
  );
}
