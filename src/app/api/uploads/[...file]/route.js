import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

function getContentType(filename) {
  const ext = path.extname(filename).toLowerCase();
  switch (ext) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    case '.gif':
      return 'image/gif';
    case '.webp':
      return 'image/webp';
    case '.svg':
      return 'image/svg+xml';
    default:
      return 'application/octet-stream';
  }
}

export async function GET(request, { params }) {
  try {
    const parts = params?.file || [];
    const filename = parts.join('/');
    if (!filename) return NextResponse.json({ error: 'Missing file name' }, { status: 400 });

    const absPath = path.join(process.cwd(), 'public', 'uploads', filename);
    // Prevent path traversal
    if (!absPath.startsWith(path.join(process.cwd(), 'public', 'uploads'))) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
    }

    if (!fs.existsSync(absPath)) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const data = await fs.promises.readFile(absPath);
    const ct = getContentType(filename);
    return new NextResponse(data, { headers: { 'Content-Type': ct } });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
