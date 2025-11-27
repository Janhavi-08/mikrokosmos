import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getImageUrl } from '../../../lib/getImageUrl';

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

    const uploadPath = path.join(uploadDir, filename);

    fs.writeFileSync(uploadPath, buffer);

    return NextResponse.json({
      url: getImageUrl(filename), // This will be handled by GET route
      filename,
    });
  } catch (err) {
    console.error('Upload error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
