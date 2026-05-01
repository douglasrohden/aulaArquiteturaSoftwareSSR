import { NextResponse } from 'next/server';
import {
  serverGetUsers,
  serverCreateUser,
  serverUpdateUser,
  serverDeleteUser,
} from '@/backend/server/actions/users';

export async function GET() {
  const users = await serverGetUsers();
  return NextResponse.json(users);
}

export async function POST(request: Request) {
  const data = await request.json();
  const user = await serverCreateUser(data);
  return NextResponse.json(user);
}

export async function PUT(request: Request) {
  const { id, ...fields } = await request.json();
  const updated = await serverUpdateUser(id, fields);
  return NextResponse.json(updated);
}

export async function DELETE(request: Request) {
  const { id } = await request.json();
  const success = await serverDeleteUser(id);
  return NextResponse.json({ success });
}