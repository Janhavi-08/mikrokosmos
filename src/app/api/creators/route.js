import fs from 'fs/promises';
import path from 'path';

const dataFile = path.join(process.cwd(), 'src', 'data', 'creators.json');

async function readData() {
  try {
    const raw = await fs.readFile(dataFile, 'utf8');
    return JSON.parse(raw || '[]');
  } catch (e) {
    return [];
  }
}

async function writeData(data) {
  await fs.writeFile(dataFile, JSON.stringify(data, null, 2), 'utf8');
}

export async function GET() {
  const creators = await readData();
  return new Response(JSON.stringify(creators), { status: 200 });
}

export async function POST(req) {
  try {
    const body = await req.json();
    const creators = await readData();
    creators.push(body);
    await writeData(creators);
    return new Response(JSON.stringify(body), { status: 201 });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const body = await req.json();
    if (!Array.isArray(body)) {
      return new Response(JSON.stringify({ error: 'PUT expects an array' }), { status: 400 });
    }
    await writeData(body);
    return new Response(JSON.stringify(body), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
}
