import { AwsClient } from 'aws4fetch';

const enc = new TextEncoder();

function cors(env) {
  return {
    'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN || '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,X-HSM-Admin-Key,X-HSM-Delivery-Password',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin'
  };
}

function json(env, data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...cors(env), 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
  });
}

function safeName(value = 'file') {
  const cleaned = String(value).replace(/[\\/]+/g, '-').replace(/[^a-zA-Z0-9._ -]+/g, '').trim();
  return (cleaned || 'file').slice(0, 180);
}

function bytesToHex(bytes) {
  return [...bytes].map(b => b.toString(16).padStart(2, '0')).join('');
}

function bytesToBase64Url(bytes) {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlToBytes(value) {
  const padded = String(value).replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
  const raw = atob(padded);
  return Uint8Array.from(raw, c => c.charCodeAt(0));
}

function randomToken(size = 32) {
  const bytes = new Uint8Array(size);
  crypto.getRandomValues(bytes);
  return bytesToBase64Url(bytes);
}

async function sha256(value) {
  const digest = await crypto.subtle.digest('SHA-256', enc.encode(String(value)));
  return bytesToHex(new Uint8Array(digest));
}

function constantTimeEqual(a, b) {
  a = String(a || ''); b = String(b || '');
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function passwordHash(password, saltB64) {
  const key = await crypto.subtle.importKey('raw', enc.encode(String(password)), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({
    name: 'PBKDF2',
    hash: 'SHA-256',
    salt: base64UrlToBytes(saltB64),
    iterations: 150000
  }, key, 256);
  return bytesToBase64Url(new Uint8Array(bits));
}

async function requireAdmin(request, env) {
  if (!env.ADMIN_KEY) throw new Response('Delivery admin key is not configured.', { status: 503 });
  const supplied = request.headers.get('X-HSM-Admin-Key') || '';
  const [a, b] = await Promise.all([sha256(supplied), sha256(env.ADMIN_KEY)]);
  if (!constantTimeEqual(a, b)) throw new Response('Unauthorized', { status: 401 });
}

function s3Client(env) {
  return new AwsClient({
    service: 's3',
    region: 'auto',
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY
  });
}

function r2ObjectUrl(env, key, expires) {
  const encodedKey = key.split('/').map(encodeURIComponent).join('/');
  return `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${encodeURIComponent(env.R2_BUCKET_NAME)}/${encodedKey}?X-Amz-Expires=${expires}`;
}

async function presign(env, key, method, contentType = '', expires = 900) {
  if (!env.R2_ACCOUNT_ID || !env.R2_ACCESS_KEY_ID || !env.R2_SECRET_ACCESS_KEY || !env.R2_BUCKET_NAME) {
    throw new Error('R2 is not fully configured.');
  }
  const headers = {};
  if (method === 'PUT') headers['Content-Type'] = contentType || 'application/octet-stream';
  const signed = await s3Client(env).sign(new Request(r2ObjectUrl(env, key, expires), { method, headers }), {
    aws: { signQuery: true }
  });
  return signed.url.toString();
}

async function getDelivery(env, id) {
  return env.DB.prepare('SELECT * FROM deliveries WHERE id = ?').bind(id).first();
}

async function verifyDeliveryAccess(request, env, id) {
  const delivery = await getDelivery(env, id);
  if (!delivery) throw new Response('Delivery not found', { status: 404 });
  if (delivery.status !== 'ready') throw new Response('Delivery is not ready', { status: 409 });
  if (delivery.expires_at && Date.parse(delivery.expires_at) <= Date.now()) throw new Response('Delivery expired', { status: 410 });

  const url = new URL(request.url);
  const token = url.searchParams.get('token') || '';
  const tokenHash = await sha256(token);
  if (!constantTimeEqual(tokenHash, delivery.token_hash)) throw new Response('Invalid delivery link', { status: 403 });

  if (delivery.password_hash) {
    const password = request.headers.get('X-HSM-Delivery-Password') || '';
    if (!password) throw json(env, { error: 'password_required' }, 401);
    const candidate = await passwordHash(password, delivery.password_salt);
    if (!constantTimeEqual(candidate, delivery.password_hash)) throw json(env, { error: 'invalid_password' }, 401);
  }
  return delivery;
}

async function createDelivery(request, env) {
  await requireAdmin(request, env);
  const body = await request.json();
  const files = Array.isArray(body.files) ? body.files : [];
  if (!files.length) return json(env, { error: 'Add at least one file.' }, 400);
  if (files.length > 500) return json(env, { error: 'A delivery can contain up to 500 files.' }, 400);

  const id = crypto.randomUUID();
  const token = randomToken(32);
  const tokenHash = await sha256(token);
  const name = String(body.name || 'Client delivery').trim().slice(0, 160) || 'Client delivery';
  const expiresAt = body.expiresAt ? new Date(body.expiresAt).toISOString() : null;

  let salt = null, pHash = null;
  if (body.password) {
    salt = randomToken(18);
    pHash = await passwordHash(String(body.password), salt);
  }

  const statements = [env.DB.prepare(
    'INSERT INTO deliveries (id,name,token_hash,status,expires_at,password_salt,password_hash) VALUES (?,?,?,?,?,?,?)'
  ).bind(id, name, tokenHash, 'uploading', expiresAt, salt, pHash)];

  const responseFiles = [];
  for (const file of files) {
    const fileId = crypto.randomUUID();
    const originalName = safeName(file.name);
    const contentType = String(file.type || 'application/octet-stream').slice(0, 180);
    const size = Math.max(0, Number(file.size) || 0);
    const key = `${id}/${fileId}-${originalName}`;
    statements.push(env.DB.prepare(
      'INSERT INTO delivery_files (id,delivery_id,object_key,original_name,content_type,size) VALUES (?,?,?,?,?,?)'
    ).bind(fileId, id, key, originalName, contentType, size));
    responseFiles.push({ id: fileId, name: originalName, type: contentType, size, key });
  }

  await env.DB.batch(statements);
  await env.DB.prepare('INSERT INTO delivery_events (delivery_id,event_type) VALUES (?,?)').bind(id, 'created').run();

  for (const file of responseFiles) {
    file.uploadUrl = await presign(env, file.key, 'PUT', file.type, 3600);
    delete file.key;
  }

  return json(env, { id, token, files: responseFiles }, 201);
}

async function completeDelivery(request, env, id) {
  await requireAdmin(request, env);
  const delivery = await getDelivery(env, id);
  if (!delivery) return json(env, { error: 'Delivery not found.' }, 404);
  await env.DB.prepare("UPDATE deliveries SET status='ready', completed_at=CURRENT_TIMESTAMP WHERE id=?").bind(id).run();
  await env.DB.prepare('INSERT INTO delivery_events (delivery_id,event_type) VALUES (?,?)').bind(id, 'ready').run();
  return json(env, { ok: true });
}

async function deliveryInfo(request, env, id) {
  const delivery = await verifyDeliveryAccess(request, env, id);
  const { results = [] } = await env.DB.prepare(
    'SELECT id,original_name,content_type,size FROM delivery_files WHERE delivery_id=? ORDER BY created_at,id'
  ).bind(id).all();
  await env.DB.prepare('UPDATE deliveries SET viewed_at=COALESCE(viewed_at,CURRENT_TIMESTAMP) WHERE id=?').bind(id).run();
  await env.DB.prepare('INSERT INTO delivery_events (delivery_id,event_type) VALUES (?,?)').bind(id, 'viewed').run();
  return json(env, {
    id: delivery.id,
    name: delivery.name,
    expiresAt: delivery.expires_at,
    passwordProtected: !!delivery.password_hash,
    files: results.map(f => ({ id: f.id, name: f.original_name, type: f.content_type, size: f.size }))
  });
}

async function downloadFile(request, env, id) {
  await verifyDeliveryAccess(request, env, id);
  const body = await request.json();
  const file = await env.DB.prepare(
    'SELECT id,object_key,original_name FROM delivery_files WHERE delivery_id=? AND id=?'
  ).bind(id, body.fileId || '').first();
  if (!file) return json(env, { error: 'File not found.' }, 404);
  const url = await presign(env, file.object_key, 'GET', '', 900);
  await env.DB.prepare('UPDATE deliveries SET download_count=download_count+1 WHERE id=?').bind(id).run();
  await env.DB.prepare('INSERT INTO delivery_events (delivery_id,event_type,file_id) VALUES (?,?,?)').bind(id, 'download', file.id).run();
  return json(env, { url, name: file.original_name });
}

async function handle(request, env) {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(env) });
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, '') || '/';

  if (request.method === 'GET' && path === '/api/health') return json(env, { ok: true, service: 'high-style-match-delivery' });
  if (request.method === 'POST' && path === '/api/deliveries') return createDelivery(request, env);

  let match = path.match(/^\/api\/deliveries\/([^/]+)$/);
  if (request.method === 'GET' && match) return deliveryInfo(request, env, decodeURIComponent(match[1]));

  match = path.match(/^\/api\/deliveries\/([^/]+)\/complete$/);
  if (request.method === 'POST' && match) return completeDelivery(request, env, decodeURIComponent(match[1]));

  match = path.match(/^\/api\/deliveries\/([^/]+)\/download$/);
  if (request.method === 'POST' && match) return downloadFile(request, env, decodeURIComponent(match[1]));

  return json(env, { error: 'Not found.' }, 404);
}

export default {
  async fetch(request, env) {
    try {
      return await handle(request, env);
    } catch (error) {
      if (error instanceof Response) {
        const headers = new Headers(error.headers);
        for (const [k, v] of Object.entries(cors(env))) headers.set(k, v);
        return new Response(error.body, { status: error.status, statusText: error.statusText, headers });
      }
      console.error(error);
      return json(env, { error: error?.message || 'Delivery server error.' }, 500);
    }
  }
};
