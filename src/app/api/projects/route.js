import fs from 'fs/promises';
import path from 'path';

const dataFile = path.join(process.cwd(), 'src', 'data', 'projects.json');

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
  const projects = await readData();
  return new Response(JSON.stringify(projects), { status: 200 });
}

// Accept a full projects array to overwrite/persist
export async function PUT(req) {
  try {
    const body = await req.json();
    if (!Array.isArray(body.projects)) {
      return new Response(JSON.stringify({ error: 'PUT expects { projects: [] }' }), { status: 400 });
    }
    await writeData(body.projects);
    return new Response(JSON.stringify(body.projects), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    // support adding single project
    const projects = await readData();
    projects.push(body);
    await writeData(projects);
    return new Response(JSON.stringify(body), { status: 201 });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
}
