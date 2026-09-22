/**
 * Validate and export required environment variables.
 * Throws on startup if critical vars are missing.
 */

const required = ['DATABASE_URL', 'JWT_SECRET', 'ADMIN_PASSWORD'];

required.forEach((key) => {
  if (!process.env[key]) {
    throw new Error(`❌  Missing required environment variable: ${key}`);
  }
});

module.exports = {
  port: parseInt(process.env.PORT || '3001', 10),
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  adminPassword: process.env.ADMIN_PASSWORD,
  mlServiceUrl: process.env.ML_SERVICE_URL || 'http://localhost:8000',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',

  // Social Media API credentials (optional — graceful fallback if missing)
  instagram: {
    accessToken: process.env.IG_ACCESS_TOKEN || null,
    userId: process.env.IG_USER_ID || null,
  },
  tiktok: {
    clientKey: process.env.TIKTOK_CLIENT_KEY || null,
    clientSecret: process.env.TIKTOK_CLIENT_SECRET || null,
  },
};
