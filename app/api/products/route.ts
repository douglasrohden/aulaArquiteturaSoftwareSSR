import { NextResponse } from 'next/server';
import {
  serverGetProducts,
  serverCreateProduct,
  serverUpdateProduct,
  serverDeleteProduct,
} from '@/backend/products';
import {
  assertScreenAccess,
  getUserIdFromRequest,
} from '@/backend/lib/access-check';

export async function GET(request: Request) {
  try {
    const uid = getUserIdFromRequest(request);
    await assertScreenAccess(uid, 'products', 'view');
    const products = await serverGetProducts();
    return NextResponse.json(products);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Acesso negado';
    return NextResponse.json({ error: message }, { status: 403 });
  }
}

export async function POST(request: Request) {
  try {
    const uid = getUserIdFromRequest(request);
    await assertScreenAccess(uid, 'products', 'add');
    const data = await request.json();
    const product = await serverCreateProduct(data);
    return NextResponse.json(product);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Acesso negado';
    return NextResponse.json({ error: message }, { status: 403 });
  }
}

export async function PUT(request: Request) {
  try {
    const uid = getUserIdFromRequest(request);
    await assertScreenAccess(uid, 'products', 'edit');
    const { id, ...fields } = await request.json();
    const updated = await serverUpdateProduct(id, fields);
    return NextResponse.json(updated);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Acesso negado';
    return NextResponse.json({ error: message }, { status: 403 });
  }
}

export async function DELETE(request: Request) {
  try {
    const uid = getUserIdFromRequest(request);
    await assertScreenAccess(uid, 'products', 'delete');
    let id: string | null = null;
    try {
      const body = await request.json();
      id = typeof body?.id === 'string' ? body.id : null;
    } catch {
      /* body opcional */
    }
    if (!id) {
      const url = new URL(request.url);
      id = url.searchParams.get('id');
    }
    if (!id) {
      return NextResponse.json({ error: 'id é obrigatório' }, { status: 400 });
    }
    const success = await serverDeleteProduct(id);
    return NextResponse.json({ success });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Acesso negado';
    return NextResponse.json({ error: message }, { status: 403 });
  }
}
