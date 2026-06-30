// Variables d'environnement minimales pour que `src/config/env.ts` valide son
// schéma Zod lors de l'import des modules testés, sans dépendre de vrais
// services externes (DB/Redis/Cloudinary/Brevo/IA réels).
process.env.NODE_ENV = 'test';
process.env.API_BASE_URL = 'http://localhost:4000';
process.env.FRONTEND_URL = 'http://localhost:3000';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.JWT_ACCESS_SECRET = 'test-access-secret-32-characters-minimum';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-32-characters-minimum';
process.env.CLOUDINARY_CLOUD_NAME = 'test';
process.env.CLOUDINARY_API_KEY = 'test';
process.env.CLOUDINARY_API_SECRET = 'test';
process.env.BREVO_API_KEY = 'test';
process.env.BREVO_SENDER_EMAIL = 'no-reply@test.local';
process.env.AI_SERVICE_URL = 'http://localhost:8000';
process.env.AI_SERVICE_SECRET = 'test-internal-secret';
