import { Readable } from 'stream';
import { cloudinary } from '@/config/cloudinary';

export interface UploadResult {
  publicId: string;
  secureUrl: string;
  bytes: number;
  version: number;
}

/**
 * Téléverse un buffer vers Cloudinary en `type: authenticated` afin que le
 * fichier ne soit jamais accessible par une URL publique directe - seules des
 * URLs signées et expirables (cf. `buildSignedDownloadUrl`) permettent le
 * téléchargement (UC2). `resourceType` vaut `raw` pour PDF/PPTX/DOCX et
 * `image` pour les images (supports personnels, pièces jointes d'annonces).
 *
 * Pour `resource_type: image`, Cloudinary sépare toujours le format de
 * l'extension du `public_id` et l'ajoute lui-même à l'URL de livraison : si on
 * lui fournit un `public_id` qui contient déjà l'extension (ex. "photo.png"),
 * l'URL générée à l'upload se retrouve en double extension ("photo.png.png").
 * On retire donc l'extension du nom de fichier avant de l'utiliser comme
 * `public_id` pour les images, afin de rester cohérent avec
 * `buildSignedDownloadUrl` qui doit régénérer une URL strictement identique.
 *
 * `version` est retourné et DOIT être conservé (avec le public_id) pour toute
 * régénération ultérieure d'URL signée via `buildSignedDownloadUrl` : sans lui,
 * Cloudinary insère un segment de version factice ("v1") dans l'URL livrée, ce
 * qui pointe vers un chemin inexistant et renvoie 404 (vérifié empiriquement).
 */
export function uploadDocumentBuffer(
  buffer: Buffer,
  folder: string,
  filename: string,
  resourceType: 'raw' | 'image' = 'raw',
): Promise<UploadResult> {
  const publicId = resourceType === 'image' ? filename.replace(/\.[^./\\]+$/, '') : filename;
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
        type: 'authenticated',
        public_id: publicId,
        use_filename: true,
        unique_filename: true,
      },
      (error, result) => {
        if (error || !result) return reject(error ?? new Error("Échec de l'upload Cloudinary"));
        resolve({ publicId: result.public_id, secureUrl: result.secure_url, bytes: result.bytes, version: result.version });
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
        resolve({ publicId: result.public_id, secureUrl: result.secure_url, bytes: result.bytes, version: result.version });
      },
    );
    Readable.from(buffer).pipe(uploadStream);
  });
}

const SIGNED_URL_VALIDITY_SECONDS = 15 * 60; // UC2 NFR : URL signée valable 15 minutes

/**
 * `version` (renvoyé par `uploadDocumentBuffer`, à persister en base) est
 * requis : sans lui Cloudinary insère un segment de version factice dans le
 * chemin livré, qui ne correspond à aucun objet réel (404 systématique).
 * `format` (extension sans le point, ex. "png") est requis pour régénérer une
 * URL signée correcte sur une image : Cloudinary l'ajoute lui-même à la
 * livraison et ne peut pas le déduire d'un `public_id` qui ne le contient pas
 * (cf. note sur `uploadDocumentBuffer`).
 */
export function buildSignedDownloadUrl(publicId: string, version: number, resourceType: 'raw' | 'image' = 'raw', format?: string): string {
  const expiresAt = Math.floor(Date.now() / 1000) + SIGNED_URL_VALIDITY_SECONDS;
  return cloudinary.url(publicId, {
    resource_type: resourceType,
    type: 'authenticated',
    sign_url: true,
    secure: true,
    expires_at: expiresAt,
    version,
    format: resourceType === 'image' ? format : undefined,
  });
}

/** Emploi du temps : fichier public classique (information non sensible, pas besoin d'URL signée pour le consulter). */
export function uploadPublicFileBuffer(buffer: Buffer, folder: string, resourceType: 'raw' | 'image' = 'raw'): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream({ folder, resource_type: resourceType }, (error, result) => {
      if (error || !result) return reject(error ?? new Error("Échec de l'upload Cloudinary"));
      resolve({ publicId: result.public_id, secureUrl: result.secure_url, bytes: result.bytes, version: result.version });
    });
    Readable.from(buffer).pipe(uploadStream);
  });
}

export async function deleteCloudinaryAsset(publicId: string, resourceType: 'raw' | 'image' = 'raw'): Promise<void> {
  await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
}
