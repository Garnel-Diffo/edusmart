import { Readable } from 'stream';
import { cloudinary } from '@/config/cloudinary';

export interface UploadResult {
  publicId: string;
  secureUrl: string;
  bytes: number;
}

/**
 * Téléverse un buffer vers Cloudinary en `resource_type: raw` (PDF/PPTX/DOCX ne
 * sont pas des images) et `type: authenticated` afin que le fichier ne soit
 * jamais accessible par une URL publique directe — seules des URLs signées et
 * expirables (cf. `buildSignedDownloadUrl`) permettent le téléchargement (UC2).
 */
export function uploadDocumentBuffer(buffer: Buffer, folder: string, filename: string): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'raw',
        type: 'authenticated',
        public_id: filename,
        use_filename: true,
        unique_filename: true,
      },
      (error, result) => {
        if (error || !result) return reject(error ?? new Error("Échec de l'upload Cloudinary"));
        resolve({ publicId: result.public_id, secureUrl: result.secure_url, bytes: result.bytes });
      },
    );
    Readable.from(buffer).pipe(uploadStream);
  });
}

/** Avatar utilisateur : image publique classique (pas de contenu sensible). */
export function uploadImageBuffer(buffer: Buffer, folder: string, publicId?: string): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image', public_id: publicId, overwrite: true },
      (error, result) => {
        if (error || !result) return reject(error ?? new Error("Échec de l'upload Cloudinary"));
        resolve({ publicId: result.public_id, secureUrl: result.secure_url, bytes: result.bytes });
      },
    );
    Readable.from(buffer).pipe(uploadStream);
  });
}

const SIGNED_URL_VALIDITY_SECONDS = 15 * 60; // UC2 NFR : URL signée valable 15 minutes

export function buildSignedDownloadUrl(publicId: string): string {
  const expiresAt = Math.floor(Date.now() / 1000) + SIGNED_URL_VALIDITY_SECONDS;
  return cloudinary.url(publicId, {
    resource_type: 'raw',
    type: 'authenticated',
    sign_url: true,
    secure: true,
    expires_at: expiresAt,
  });
}
