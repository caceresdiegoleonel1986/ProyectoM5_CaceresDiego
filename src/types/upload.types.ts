export interface PresignedUploadResponse {
  uploadUrl: string;
  fields: Record<string, string>;
  fileKey: string;
  publicUrl: string;
  expiresInSeconds: number;
}

export interface UploadOptions {
  folder?: string;
  allowedTypes?: string[];
  maxSizeInBytes?: number;
}
