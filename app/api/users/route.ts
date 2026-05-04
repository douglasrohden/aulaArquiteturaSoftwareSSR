import { NextResponse } from 'next/server';
import {
  serverGetUsers,
  serverCreateUser,
  serverUpdateUser,
  serverDeleteUser,
} from '@/backend/server/actions/users';
import {
  assertScreenAccess,
  getUserIdFromRequest,
} from '@/backend/lib/access-check';

export async function GET(request: Request) {
  try {
    const uid = getUserIdFromRequest(request);
    await assertScreenAccess(uid, 'users', 'view');
    const users = await serverGetUsers();
    return NextResponse.json(users);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Acesso negado';
    return NextResponse.json({ error: message }, { status: 403 });
  }
}

export async function POST(request: Request) {
  try {
    const uid = getUserIdFromRequest(request);
    await assertScreenAccess(uid, 'users', 'add');
    const data = await request.json();
    const user = await serverCreateUser(data);
    return NextResponse.json(user);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to create user';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  try {
    const uid = getUserIdFromRequest(request);
    await assertScreenAccess(uid, 'users', 'edit');
    const { id, ...fields } = await request.json();
    if (!id) {
      return NextResponse.json({ error: 'User id is required' }, { status: 400 });
    }
    const updated = await serverUpdateUser(id, fields);
    return NextResponse.json(updated);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to update user';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const uid = getUserIdFromRequest(request);
    await assertScreenAccess(uid, 'users', 'delete');
    const { id } = await request.json();
    const success = await serverDeleteUser(id);
    return NextResponse.json({ success });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Acesso negado';
    return NextResponse.json({ error: message }, { status: 403 });
  }
}
