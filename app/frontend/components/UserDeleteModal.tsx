'use client';

import { useState } from 'react';
import styles from './UserDeleteModal.module.css';

interface UserDeleteModalProps {
  isOpen: boolean;
  userName: string;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

export default function UserDeleteModal({
  isOpen,
  userName,
  onConfirm,
  onCancel,
}: UserDeleteModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);

    try {
      await onConfirm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao deletar usuário');
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Confirmar Exclusão</h2>
          <button className={styles.closeBtn} onClick={onCancel}>
            ✕
          </button>
        </div>

        <div className={styles.body}>
          {error && <div className={styles.error}>{error}</div>}
          
          <p>
            Tem certeza que deseja deletar o usuário <strong>{userName}</strong>?
          </p>
          <p className={styles.warning}>
            ⚠️ Esta ação é irreversível e não pode ser desfeita.
          </p>
        </div>

        <div className={styles.footer}>
          <button
            className={styles.btnCancel}
            onClick={onCancel}
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            className={styles.btnDelete}
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? 'Deletando...' : 'Deletar Usuário'}
          </button>
        </div>
      </div>
    </div>
  );
}
