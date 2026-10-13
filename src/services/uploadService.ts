import { httpsCallable } from "firebase/functions";
import { functions } from "./firebase";
import type { PresignedUploadResponse, UploadOptions } from "../types/upload.types";

type UploadRequest = { filename: string; contentType: string; folder: string };

const createPresignedUpload = httpsCallable<UploadRequest, PresignedUploadResponse>(
  functions,
  "createPresignedUpload",
);

/**
 * Solicita una URL firmada a Functions y sube el binario directamente a S3.
 */
export async function getPresignedUploadUrl(
  filename: string,
  contentType: string,
  folder = "products"
): Promise<PresignedUploadResponse> {
  const result = await createPresignedUpload({ filename, contentType, folder });
  return result.data;
}

/**
 * Sube un archivo usando Presigned URL o Firebase Storage con validación de tipo y tamaño.
 */
export async function uploadFileSecurely(
  file: File,
  options: UploadOptions = {}
): Promise<string> {
  const {
    folder = "products",
    allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"],
    maxSizeInBytes = 5 * 1024 * 1024, // 5MB
  } = options;
  const effectiveMaxSize = Math.min(maxSizeInBytes, 5 * 1024 * 1024);

  // Validación de tipo de archivo
  if (!allowedTypes.includes(file.type)) {
    throw new Error(`Tipo de archivo no permitido: ${file.type}. Formatos permitidos: ${allowedTypes.join(", ")}`);
  }

  // Validación de tamaño máximo
  if (file.size > effectiveMaxSize) {
    const maxMb = (effectiveMaxSize / (1024 * 1024)).toFixed(0);
    throw new Error(`El archivo supera el tamaño máximo permitido de ${maxMb}MB`);
  }

  const presigned = await getPresignedUploadUrl(file.name, file.type, folder);
  const formData = new FormData();
  Object.entries(presigned.fields).forEach(([name, value]) => formData.append(name, value));
  formData.append("file", file);
  const putRes = await fetch(presigned.uploadUrl, {
    method: "POST",
    body: formData,
  });

  if (!putRes.ok) {
    throw new Error(`No se pudo subir el archivo a S3: ${putRes.statusText}`);
  }
  return presigned.publicUrl;
}
