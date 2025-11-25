import { NextResponse } from 'next/server';
import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('image');
    if (!file || typeof file !== 'object' || !('arrayBuffer' in file)) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const name = (file.name && file.name.replace(/[^a-zA-Z0-9._-]/g, '_')) || `file-${Date.now()}`;
    const filename = `${Date.now()}-${name}`;
    const filePath = path.join(uploadDir, filename);
    await fsPromises.writeFile(filePath, buffer);
    // Return an absolute URL to the saved file so the client can verify/fetch it reliably
    const host = (request.headers && request.headers.get && request.headers.get('host')) || 'localhost:3000';
    const proto = (request.headers && request.headers.get && request.headers.get('x-forwarded-proto')) || 'http';
    const relPath = `${proto}://${host}/uploads/${filename}`;
    console.log('Uploaded file saved at:', filePath);
    return NextResponse.json({ path: relPath }, { status: 200 });
  } catch (err) {
    console.error('Upload error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
