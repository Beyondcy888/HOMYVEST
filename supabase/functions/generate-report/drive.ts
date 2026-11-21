// Google Drive upload for the HOMYVEST report function.
// Two auth modes (set GDRIVE_AUTH_MODE):
//   "oauth"           -> personal Gmail. Uses GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / GOOGLE_REFRESH_TOKEN,
//                        scope drive.file. Files go to a folder the app creates in your My Drive
//                        (GDRIVE_FOLDER_NAME, default "HOMYVEST Leads"), unless GDRIVE_FOLDER_ID is set
//                        to a folder this same app created.
//   "service_account" -> Google Workspace with a Shared Drive. Uses GOOGLE_SERVICE_ACCOUNT_JSON_B64
//                        (base64 of the JSON key) and GDRIVE_FOLDER_ID (a folder inside a Shared Drive
//                        where the service account is a Content manager).
// Never logs secrets.

type Env = (key: string) => string | undefined;

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const DRIVE = "https://www.googleapis.com/drive/v3";
const UPLOAD = "https://www.googleapis.com/upload/drive/v3/files";

let tokenCache: { token: string; exp: number } | null = null;
let folderCache: string | null = null;

export function base64url(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function signServiceAccountJwt(
  sa: { client_email: string; private_key: string; token_uri?: string },
  scope: string,
  nowSec = Math.floor(Date.now() / 1000),
): Promise<string> {
  const enc = new TextEncoder();
  const header = base64url(enc.encode(JSON.stringify({ alg: "RS256", typ: "JWT" })));
  const claims = base64url(enc.encode(JSON.stringify({
    iss: sa.client_email, scope, aud: sa.token_uri ?? TOKEN_URL, iat: nowSec, exp: nowSec + 3600,
  })));
  const input = `${header}.${claims}`;
  const pem = sa.private_key.replace(/-----[A-Z ]+-----/g, "").replace(/\s+/g, "");
  const der = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey("pkcs8", der, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const sig = new Uint8Array(await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, enc.encode(input)));
  return `${input}.${base64url(sig)}`;
}

export function buildMultipart(metadata: Record<string, unknown>, file: Uint8Array, mime: string, boundary: string): Uint8Array {
  const enc = new TextEncoder();
  const head = enc.encode(
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n` +
    `--${boundary}\r\nContent-Type: ${mime}\r\n\r\n`,
  );
  const tail = enc.encode(`\r\n--${boundary}--\r\n`);
  const out = new Uint8Array(head.length + file.length + tail.length);
  out.set(head, 0); out.set(file, head.length); out.set(tail, head.length + file.length);
  return out;
}

async function postForm(url: string, form: Record<string, string>): Promise<{ access_token: string; expires_in: number }> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(form),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Google token request failed (${res.status}): ${text.slice(0, 200)}`);
  return JSON.parse(text);
}

function mode(env: Env): "oauth" | "service_account" {
  const m = (env("GDRIVE_AUTH_MODE") ?? "oauth").trim().toLowerCase();
  if (m !== "oauth" && m !== "service_account") throw new Error(`GDRIVE_AUTH_MODE must be "oauth" or "service_account"`);
  return m;
}

export async function getAccessToken(env: Env): Promise<string> {
  if (tokenCache && tokenCache.exp > Date.now() + 60_000) return tokenCache.token;
  let res: { access_token: string; expires_in: number };
  if (mode(env) === "oauth") {
    const id = env("GOOGLE_CLIENT_ID"), secret = env("GOOGLE_CLIENT_SECRET"), refresh = env("GOOGLE_REFRESH_TOKEN");
    if (!id || !secret || !refresh) throw new Error("Missing GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / GOOGLE_REFRESH_TOKEN");
    res = await postForm(TOKEN_URL, { client_id: id, client_secret: secret, refresh_token: refresh, grant_type: "refresh_token" });
  } else {
    const b64 = env("GOOGLE_SERVICE_ACCOUNT_JSON_B64");
    if (!b64) throw new Error("Missing GOOGLE_SERVICE_ACCOUNT_JSON_B64");
    const sa = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(b64.trim()), (c) => c.charCodeAt(0))));
    const jwt = await signServiceAccountJwt(sa, "https://www.googleapis.com/auth/drive");
    res = await postForm(sa.token_uri ?? TOKEN_URL, { grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: jwt });
  }
  tokenCache = { token: res.access_token, exp: Date.now() + res.expires_in * 1000 };
  return res.access_token;
}

async function driveJson(url: string, token: string, init: RequestInit = {}) {
  const res = await fetch(url, { ...init, headers: { Authorization: `Bearer ${token}`, ...(init.headers ?? {}) } });
  const text = await res.text();
  if (!res.ok) throw new Error(`Drive API ${res.status}: ${text.slice(0, 300)}`);
  return text ? JSON.parse(text) : {};
}

export async function ensureFolder(env: Env, token: string): Promise<string> {
  const configured = env("GDRIVE_FOLDER_ID")?.trim();
  if (configured) return configured;
  if (mode(env) === "service_account") {
    throw new Error("GDRIVE_FOLDER_ID is required in service_account mode (a folder inside a Shared Drive)");
  }
  if (folderCache) return folderCache;
  const name = (env("GDRIVE_FOLDER_NAME") ?? "HOMYVEST Leads").trim();
  const q = `name = '${name.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
  const found = await driveJson(`${DRIVE}/files?q=${encodeURIComponent(q)}&fields=files(id,name)&pageSize=1&spaces=drive`, token);
  if (found.files?.length) return (folderCache = found.files[0].id as string);
  const created = await driveJson(`${DRIVE}/files?fields=id`, token, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, mimeType: "application/vnd.google-apps.folder" }),
  });
  return (folderCache = created.id as string);
}

export async function uploadPdfToDrive(env: Env, bytes: Uint8Array, fileName: string): Promise<{ id: string; webViewLink?: string }> {
  const token = await getAccessToken(env);
  const folderId = await ensureFolder(env, token);
  const boundary = `homyvest_${crypto.randomUUID().replace(/-/g, "")}`;
  const body = buildMultipart({ name: fileName, mimeType: "application/pdf", parents: [folderId] }, bytes, "application/pdf", boundary);
  return await driveJson(`${UPLOAD}?uploadType=multipart&supportsAllDrives=true&fields=id,webViewLink`, token, {
    method: "POST",
    headers: { "Content-Type": `multipart/related; boundary=${boundary}` },
    body: body as unknown as BodyInit,   // Uint8Array is a valid body; the cast only satisfies strict DOM typings
  });
}
