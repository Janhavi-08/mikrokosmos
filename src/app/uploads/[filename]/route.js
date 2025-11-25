import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { Readable } from 'stream';

export async function GET(req, { params } = {}) {
  try {
    if (!params) {
      return new NextResponse('Missing filename', { status: 400 });
    }

    let { filename } = params;
    // Support catch-all (array) or single param
    if (Array.isArray(filename)) filename = filename.join('/');
    if (!filename) return new NextResponse('Missing filename', { status: 400 });

    // Decode in case of encoded characters
    filename = decodeURIComponent(String(filename));

    const filePath = path.join(process.cwd(), 'public', 'uploads', filename);

    if (!fs.existsSync(filePath)) {
      return new NextResponse('File not found', { status: 404 });
    }

    const stats = fs.statSync(filePath);
    const nodeStream = fs.createReadStream(filePath);
    const webStream = Readable.toWeb(nodeStream);

    // Detect content type
    const ext = path.extname(filename).toLowerCase();
    let contentType = 'image/jpeg';
    if (ext === '.png') contentType = 'image/png';
    if (ext === '.webp') contentType = 'image/webp';
    if (ext === '.gif') contentType = 'image/gif';
    if (ext === '.svg') contentType = 'image/svg+xml';

    return new NextResponse(webStream, {
      headers: {
        'Content-Type': contentType,
        'Content-Length': String(stats.size),
        'Cache-Control': 'public, max-age=31536000',
      },
    });
  } catch (err) {
    console.error('uploads route error:', err);
    return new NextResponse(String(err), { status: 500 });
  }
}
