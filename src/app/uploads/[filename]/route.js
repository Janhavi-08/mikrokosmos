import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(req, { params }) {
  const { filename } = params;

  const filePath = path.join(process.cwd(), "public", "uploads", filename);

  if (!fs.existsSync(filePath)) {
    return new NextResponse("File not found", { status: 404 });
  }

  const fileBuffer = fs.readFileSync(filePath);

  // Detect content type
  const ext = path.extname(filename).toLowerCase();
  let contentType = "image/jpeg";
  if (ext === ".png") contentType = "image/png";
  if (ext === ".webp") contentType = "image/webp";
  if (ext === ".gif") contentType = "image/gif";

  return new NextResponse(fileBuffer, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000",
    },
  });
}
