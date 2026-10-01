import { NextResponse } from 'next/server';
import { requireAdmin, sameOrigin } from '@/lib/security';
import { putObject } from '@/lib/b2';
import crypto from 'node:crypto';

export async function POST(req: Request) {
  if (!(await sameOrigin())) return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
  const user = await requireAdmin();
  const form = await req.formData(); const file = form.get('file'); const folder = String(form.get('folder') || 'store');
  if (!(file instanceof File)) return NextResponse.json({ error: 'File required.' }, { status: 400 });
  if (file.size > 12 * 1024 * 1024) return NextResponse.json({ error: 'Image must be 12 MB or smaller.' }, { status: 400 });
  if (!/^image\/(png|jpeg|webp|svg\+xml)$/i.test(file.type)) return NextResponse.json({ error: 'Use PNG, JPG, WebP or SVG.' }, { status: 400 });
  const ext = file.name.split('.').pop()?.toLowerCase() || 'bin'; const key = `public/${folder}/${crypto.randomUUID()}.${ext}`;
  const uploaded = await putObject(key, new Uint8Array(await file.arrayBuffer()), file.type || 'application/octet-stream');
  await (await import('@/lib/db')).db.auditLog.create({ data: { actorUserId: user.id, action: 'STORAGE_IMAGE_UPLOADED', targetType: 'StorageObject', metadata: { key: uploaded.key, folder } } });
  return NextResponse.json({ ok: true, key: uploaded.key });
}
