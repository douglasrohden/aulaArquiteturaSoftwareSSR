'use client';

import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { User, UpdateUserInput } from '@/backend/types/user';
import styles from './UserProfileEdit.module.css'; 

interface UserProfileEditProps {
  user: User;
  onSuccess?: () => void;
  onCancel?: () => void;
}

type ProfileOption = { id: string; name: string };

export default function UserProfileEdit({
  user,
  onSuccess,
  onCancel,
}: UserProfileEditProps) { 
  const [profiles, setProfiles] = useState<ProfileOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<UpdateUserInput>({
    name: user.name,
    email: user.email,
    phone: user.phone || '',
    avatar: user.avatar || '',
    bio: user.bio || '',
    profile_id: user.profile_id ?? '',
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/access/profiles', {
          headers: { ...(authHeaders as Record<string, string>) },
        });
        if (!res.ok) return;
        const data = (await res.json()) as ProfileOption[];
        if (!cancelled && Array.isArray(data)) setProfiles(data);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authHeaders]);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const body: Record<string, unknown> = {
        id: user.id,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        avatar: formData.avatar,
        bio: formData.bio,
      };
      if (formData.profile_id && String(formData.profile_id).trim() !== '') {
        body.profile_id = formData.profile_id;
      }

      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(authHeaders as Record<string, string>),
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Falha ao atualizar perfil');
      }

      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      {error && (
        <div className={styles.error}>
          {error}
        </div>
      )}

      <div className={styles.group}>
        <label htmlFor="name">Nome *</label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          className={styles.input}
        />
      </div>

      <div className={styles.group}>
        <label htmlFor="email">Email *</label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
          className={styles.input}
        />
      </div>

      <div className={styles.group}>
        <label htmlFor="profile_id">Perfil de acesso</label>
        <select
          id="profile_id"
          name="profile_id"
          value={formData.profile_id ?? ''}
          onChange={handleChange}
          className={styles.input}
        >
          <option value="">Padrão (Administrador)</option>
          {profiles.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.group}>
        <label htmlFor="phone">Telefone</label>
        <input
          type="tel"
          id="phone"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          placeholder="(11) 99999-9999"
          className={styles.input}
        />
      </div>

      <div className={styles.group}>
        <label htmlFor="avatar">URL da Foto</label>
        <input
          type="url"
          id="avatar"
          name="avatar"
          value={formData.avatar}
          onChange={handleChange}
          placeholder="https://example.com/photo.jpg"
          className={styles.input}
        />
      </div>

      <div className={styles.group}>
        <label htmlFor="bio">Bio</label>
        <textarea
          id="bio"
          name="bio"
          value={formData.bio}
          onChange={handleChange}
          placeholder="Escreva sobre você..."
          rows={4}
          className={styles.textarea}
        />
      </div>

      <div className={styles.actions}>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className={styles.btnCancel}
            disabled={loading}
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className={styles.btnSave}
        >
          {loading ? 'Salvando...' : 'Salvar Alterações'}
        </button>
      </div>
    </form>
  );
}
