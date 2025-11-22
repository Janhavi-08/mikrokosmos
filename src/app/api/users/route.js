import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { promisify } from 'util';

const scrypt = promisify(crypto.scrypt);
const dataFile = path.join(process.cwd(), 'src', 'data', 'users.json');

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

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = await scrypt(password, salt, 64);
  return `${salt}:${derived.toString('hex')}`;
}

export async function GET() {
  const users = await readData();
  // do not return password hashes to clients in general, but some parts of the app fetch users.
  // We'll return users with password omitted to avoid exposing hashes.
  const safe = users.map(u => ({ username: u.username, email: u.email, role: u.role }));
  return new Response(JSON.stringify(safe), { status: 200 });
}

export async function POST(req) {
  try {
    const body = await req.json();
    // Expect body to contain username, password, email, role
    if (!body || !body.username || !body.password) {
      return new Response(JSON.stringify({ error: 'username and password required' }), { status: 400 });
    }
    const users = await readData();
    if (users.find(u => u.username === body.username)) {
      return new Response(JSON.stringify({ error: 'username exists' }), { status: 409 });
    }

    const hashed = await hashPassword(body.password);
    const newUser = { username: body.username, email: body.email || '', password: hashed, role: body.role || 'user' };
    users.push(newUser);
    await writeData(users);
    // return user info without password
    const { password, ...safe } = newUser;
    return new Response(JSON.stringify(safe), { status: 201 });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const body = await req.json();
    if (!Array.isArray(body)) {
      return new Response(JSON.stringify({ error: 'PUT expects an array of users' }), { status: 400 });
    }
    // Ensure any provided passwords are already hashed; we won't re-hash here.
    await writeData(body);
    return new Response(JSON.stringify(body), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
}
