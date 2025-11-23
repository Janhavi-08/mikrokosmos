import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET() {
  try {
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    let files = [];
    try {
      const list = await fs.readdir(uploadDir);
      // Expose files via the dynamic API endpoint to avoid static-serving issues
      files = list.filter(f => f && f[0] !== '.').map(f => `/api/uploads/${f}`);
    } catch (e) {
      // directory may not exist yet
      files = [];
    }
    return NextResponse.json({ files });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
