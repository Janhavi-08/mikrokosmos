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

async function verifyPassword(stored, supplied) {
  // stored format: salt:hashHex
  try {
    const [salt, keyHex] = stored.split(':');
    const derived = await scrypt(supplied, salt, 64);
    return crypto.timingSafeEqual(Buffer.from(keyHex, 'hex'), Buffer.from(derived.toString('hex'), 'hex'));
  } catch (e) {
    return false;
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { username, password } = body || {};
    if (!username || !password) return new Response(JSON.stringify({ error: 'username and password required' }), { status: 400 });

    const users = await readData();
    const user = users.find(u => u.username === username);
    if (!user) return new Response(JSON.stringify({ error: 'invalid credentials' }), { status: 401 });

    const ok = await verifyPassword(user.password, password);
    if (!ok) return new Response(JSON.stringify({ error: 'invalid credentials' }), { status: 401 });

    // Successful login: return non-sensitive user info
    const { password: _p, ...safe } = user;
    return new Response(JSON.stringify({ user: safe }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
}
