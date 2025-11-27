import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { Readable } from 'stream';

export async function GET(req, { params } = {}) {
  try {
    if (!params) {
      return new NextResponse('Missing filename', { status: 400 });
    }

    let filename = params.filename;
    // Support catch-all (array) or single param
    if (!filename) return new NextResponse('Missing filename', { status: 400 });

    // Decode in case of encoded characters
    filename = decodeURIComponent(String(filename));

     const filePath = path.join(
      process.cwd(),
      "public",
      "uploads",
      decodeURIComponent(filename)
    );

    if (!fs.existsSync(filePath)) {
      return new NextResponse('File not found', { status: 404 });
    }

    
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".webp": "image/webp",
      ".gif": "image/gif",
      ".svg": "image/svg+xml",
    };
   const file = fs.readFileSync(filePath);

    return new NextResponse(file, {
      headers: {
        "Content-Type": mimeTypes[ext] || "application/octet-stream",
      },
    });

  } catch (err) {
    console.error('uploads route error:', err);
    return new NextResponse(String(err), { status: 500 });
  }
}
