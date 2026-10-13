import { auth } from "./firebase";
import type { PresignedUploadResponse, UploadOptions } from "../types/upload.types";

const SIGNER_URL: string = import.meta.env.VITE_UPLOAD_API_URL || "/api/presign-upload";

/** Pide al firmador serverless (solo admins) una URL prefirmada de S3. */
export async function getPresignedUploadUrl(contentType: string, folder: string): Promise<PresignedUploadResponse> {
  const idToken = await auth.currentUser?.getIdToken();
  if (!idToken) throw new Error("Inicia sesión como administrador para subir imágenes.");

  const response = await fetch(SIGNER_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
    body: JSON.stringify({ contentType, folder }),
  });
  if (!response.ok) throw new Error(`No se pudo autorizar la subida (${response.status}).`);
  return (await response.json()) as PresignedUploadResponse;
}

/** Valida tipo y tamaño en el cliente y sube el archivo directo a S3 con la política firmada. */
export async function uploadFileSecurely(
  file: File,
  options: UploadOptions = {}
): Promise<string> {
  const {
    folder = "products",
    allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"],
    maxSizeInBytes = 5 * 1024 * 1024,
  } = options;
  const effectiveMaxSize = Math.min(maxSizeInBytes, 5 * 1024 * 1024);

  if (!allowedTypes.includes(file.type)) {
    throw new Error(`Tipo de archivo no permitido: ${file.type}. Formatos permitidos: ${allowedTypes.join(", ")}`);
  }
  if (file.size > effectiveMaxSize) {
    const maxMb = (effectiveMaxSize / (1024 * 1024)).toFixed(0);
    throw new Error(`El archivo supera el tamaño máximo permitido de ${maxMb}MB`);
  }

  const presigned = await getPresignedUploadUrl(file.type, folder);
  const formData = new FormData();
  Object.entries(presigned.fields).forEach(([name, value]) => formData.append(name, value));
  // S3 exige que "file" sea el último campo del formulario.
  formData.append("file", file);

  const upload = await fetch(presigned.uploadUrl, { method: "POST", body: formData });
  if (!upload.ok) {
    throw new Error(`No se pudo subir el archivo a S3: ${upload.statusText}`);
  }
  return presigned.publicUrl;
}
