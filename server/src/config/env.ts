import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  JWT_SECRET: process.env.JWT_SECRET || 'secret-jwt-dev-key',
  DATABASE_URL: process.env.DATABASE_URL || '',
  DB_SERVER: process.env.DB_SERVER || 'localhost',
  DB_PORT: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 1433,
  DB_NAME: process.env.DB_NAME || 'AIBusinessSaaS',
  DB_USER: process.env.DB_USER || 'saas_user',
  DB_PASSWORD: process.env.DB_PASSWORD || 'StrongPassword!2026',
  DB_ENCRYPT: process.env.DB_ENCRYPT === 'true',
  DB_TRUST_SERVER_CERTIFICATE: process.env.DB_TRUST_SERVER_CERTIFICATE !== 'false',
  REDIS_URL: process.env.REDIS_URL || '',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  OPENAI_BASE_URL: process.env.OPENAI_BASE_URL || '',
  OPENAI_MODEL: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  DEFAULT_TENANT_ID: process.env.DEFAULT_TENANT_ID || 'tenant_default_demo'
};
