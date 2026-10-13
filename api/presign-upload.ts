import type { VercelRequest, VercelResponse } from "@vercel/node";
import { S3Client } from "@aws-sdk/client-s3";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import { randomUUID } from "node:crypto";

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const EXPIRES_IN_SECONDS = 300;
const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};
const FOLDERS = new Set(["products"]);

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Falta la variable de entorno ${name}`);
  return value;
}

/** Valida el ID token con Firebase Auth y lee users/{uid} con ese mismo token, de modo que las reglas de Firestore deciden el acceso. */
async function isAdmin(idToken: string): Promise<boolean> {
  const lookup = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${requireEnv("FIREBASE_API_KEY")}`,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idToken }) },
  );
  if (!lookup.ok) return false;
  const { users } = (await lookup.json()) as { users?: Array<{ localId?: string }> };
  const uid = users?.[0]?.localId;
  if (!uid) return false;

  const profile = await fetch(
    `https://firestore.googleapis.com/v1/projects/${requireEnv("FIREBASE_PROJECT_ID")}/databases/(default)/documents/users/${uid}`,
    { headers: { Authorization: `Bearer ${idToken}` } },
  );
  if (!profile.ok) return false;
  const body = (await profile.json()) as { fields?: { role?: { stringValue?: string } } };
  return body.fields?.role?.stringValue === "admin";
}

function applyCors(request: VercelRequest, response: VercelResponse): void {
  const allowed = process.env.ALLOWED_ORIGIN;
  if (allowed && request.headers.origin === allowed) {
    response.setHeader("Access-Control-Allow-Origin", allowed);
    response.setHeader("Vary", "Origin");
    response.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
    response.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  }
}

export default async function handler(request: VercelRequest, response: VercelResponse): Promise<void> {
  applyCors(request, response);
  if (request.method === "OPTIONS") {
    response.status(204).end();
    return;
  }
  if (request.method !== "POST") {
    response.status(405).json({ error: "Método no permitido." });
    return;
  }

  const token = request.headers.authorization?.replace(/^Bearer\s+/i, "");
  if (!token || !(await isAdmin(token))) {
    response.status(403).json({ error: "Solo administradores." });
    return;
  }

  const { contentType, folder } = (request.body ?? {}) as { contentType?: string; folder?: string };
  const extension = contentType ? EXTENSIONS[contentType] : undefined;
  if (!contentType || !extension) {
    response.status(400).json({ error: "Tipo de archivo no permitido." });
    return;
  }
  if (!folder || !FOLDERS.has(folder)) {
    response.status(400).json({ error: "Carpeta no permitida." });
    return;
  }

  // La clave la genera el servidor; el nombre original del cliente se ignora.
  const fileKey = `${folder}/${randomUUID()}.${extension}`;
  const client = new S3Client({
    region: requireEnv("S3_REGION"),
    credentials: {
      accessKeyId: requireEnv("AWS_ACCESS_KEY_ID"),
      secretAccessKey: requireEnv("AWS_SECRET_ACCESS_KEY"),
    },
  });
  const { url, fields } = await createPresignedPost(client, {
    Bucket: requireEnv("S3_BUCKET"),
    Key: fileKey,
    Conditions: [
      ["content-length-range", 1, MAX_UPLOAD_BYTES],
      ["eq", "$Content-Type", contentType],
    ],
    Fields: { "Content-Type": contentType },
    Expires: EXPIRES_IN_SECONDS,
  });

  response.status(200).json({
    uploadUrl: url,
    fields,
    fileKey,
    publicUrl: `${requireEnv("S3_PUBLIC_BASE_URL").replace(/\/$/, "")}/${fileKey}`,
    expiresInSeconds: EXPIRES_IN_SECONDS,
  });
}
