import {
  getAllUsers,
  getPermissionMatrixForUser,
  initDatabase,
} from '@/backend/db';
import type { ScreenKey } from '@/backend/types/access';

export type ScreenAction = 'view' | 'add' | 'edit' | 'delete';

/**
 * Identificador do usuário autenticado (`x-user-id` ou `Authorization: Bearer <id>`).
 * Em desenvolvimento, sem header: usa `DEV_API_USER_ID` no `.env.local` ou o primeiro usuário do banco.
 */
export async function getUserIdFromRequest(request: Request): Promise<string> {
  const headerId = request.headers.get('x-user-id')?.trim();
  if (headerId) return headerId;

  const auth = request.headers.get('authorization');
  if (auth?.toLowerCase().startsWith('bearer ')) {
    const id = auth.slice(7).trim();
    if (id) return id;
  }

  if (process.env.NODE_ENV === 'development') {
    const fromEnv = process.env.DEV_API_USER_ID?.trim();
    if (fromEnv) return fromEnv;
    await initDatabase();
    const users = await getAllUsers();
    if (users.length > 0) return users[0].id;
  }

  throw new Error('Não autenticado');
}

export async function assertScreenAccess(
  userId: string,
  screen: ScreenKey,
  action: ScreenAction
): Promise<void> {
  await initDatabase();
  const matrix = await getPermissionMatrixForUser(userId);
  if (!matrix) {
    throw new Error('Perfil de acesso não configurado');
  }
  if (!matrix[screen][action]) {
    throw new Error('Acesso negado');
  }
}
