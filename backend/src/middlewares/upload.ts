import multer from 'multer';
import { ApiError } from '@/utils/ApiError';

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // UC3 : 50 Mo max

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
]);

/** Upload en mémoire (le buffer est ensuite streamé vers Cloudinary, jamais écrit sur disque). */
export const uploadCoursDocument = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter: (_req, file, callback) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      return callback(ApiError.badRequest('Format de fichier non supporté. Formats acceptés : PDF, PPTX, DOCX.'));
    }
    callback(null, true);
  },
}).single('fichier');

export const uploadAvatar = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    if (!file.mimetype.startsWith('image/')) {
      return callback(ApiError.badRequest('Seules les images sont acceptées pour un avatar.'));
    }
    callback(null, true);
  },
}).single('avatar');
