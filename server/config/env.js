import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from root or server directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const requiredVars = ['JWT_SECRET', 'JWT_REFRESH_SECRET'];
const missing = requiredVars.filter(v => !process.env[v]);

if (missing.length > 0 && process.env.NODE_ENV === 'production') {
  console.error(`FATAL INITIALIZATION ERROR: Missing environment variables: ${missing.join(', ')}`);
  process.exit(1);
}

export const env = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  JWT_SECRET: process.env.JWT_SECRET || 'fallback_development_jwt_secret_key_extremely_long_and_secure',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'fallback_development_jwt_refresh_secret_key_extremely_long_and_secure',
  DATABASE_PATH: process.env.DATABASE_PATH || path.resolve(__dirname, '../database/database.sqlite'),
  NODE_ENV: process.env.NODE_ENV || 'development',
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
    : ['http://localhost:5173', 'http://localhost:5000']
};
