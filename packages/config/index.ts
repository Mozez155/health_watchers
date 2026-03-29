import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: path.resolve(__dirname, '../../.env') });
}

// ---------------------------------------------------------------------------
// Schema — required vars exit with code 1 if missing; optional have defaults
// ---------------------------------------------------------------------------
const envSchema = z.object({
  // Database — required
  MONGO_URI: z
    .string({ required_error: 'MONGO_URI is required' })
    .min(1, 'MONGO_URI is required'),

  // JWT — required
  JWT_ACCESS_TOKEN_SECRET: z
    .string({ required_error: 'JWT_ACCESS_TOKEN_SECRET is required' })
    .min(32, 'JWT_ACCESS_TOKEN_SECRET must be at least 32 characters'),
  JWT_REFRESH_TOKEN_SECRET: z
    .string({ required_error: 'JWT_REFRESH_TOKEN_SECRET is required' })
    .min(32, 'JWT_REFRESH_TOKEN_SECRET must be at least 32 characters'),

  // Stellar — required
  STELLAR_SECRET_KEY: z
    .string({ required_error: 'STELLAR_SECRET_KEY is required' })
    .min(1, 'STELLAR_SECRET_KEY is required'),

  // AI — required (set to empty string to disable AI module)
  GEMINI_API_KEY: z
    .string({ required_error: 'GEMINI_API_KEY is required' })
    .min(1, 'GEMINI_API_KEY is required'),

  // Optional with defaults
  API_PORT: z.string().default('3001'),
  NODE_ENV: z.string().default('development'),
  JWT_SECRET: z.string().optional(),
  JWT_ISSUER: z.string().default('health-watchers-api'),
  JWT_AUDIENCE: z.string().default('health-watchers-client'),
  STELLAR_NETWORK: z.enum(['testnet', 'mainnet']).default('testnet'),
  STELLAR_PLATFORM_PUBLIC_KEY: z.string().default(''),
  STELLAR_SERVICE_URL: z.string().default('http://localhost:3002'),
  SUPPORTED_ASSETS: z.string().default('XLM'),
  FIELD_ENCRYPTION_KEY: z.string().default(''),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  console.error('\n❌ Configuration error — missing required environment variables:\n');

  const errors = result.error.errors;
  const varWidth = Math.max(8, ...errors.map((e) => String(e.path[0] ?? '').length));
  const msgWidth = Math.max(5, ...errors.map((e) => e.message.length));
  const divider = `+-${'-'.repeat(varWidth)}-+-${'-'.repeat(msgWidth)}-+`;

  console.error(divider);
  console.error(`| ${'Variable'.padEnd(varWidth)} | ${'Issue'.padEnd(msgWidth)} |`);
  console.error(divider);
  for (const err of errors) {
    const varName = String(err.path[0] ?? 'unknown').padEnd(varWidth);
    const msg = err.message.padEnd(msgWidth);
    console.error(`| ${varName} | ${msg} |`);
  }
  console.error(divider);
  console.error('');

  process.exit(1);
}

const env = result.data;

const network = env.STELLAR_NETWORK;
const horizonUrl =
  network === 'mainnet' ? 'https://horizon.stellar.org' : 'https://horizon-testnet.stellar.org';

export const config = {
  // Server
  apiPort: env.API_PORT,
  nodeEnv: env.NODE_ENV,

  // Database
  mongoUri: env.MONGO_URI,

  // JWT
  jwt: {
    accessTokenSecret: env.JWT_ACCESS_TOKEN_SECRET,
    refreshTokenSecret: env.JWT_REFRESH_TOKEN_SECRET,
    issuer: env.JWT_ISSUER,
    audience: env.JWT_AUDIENCE,
  },

  // Blockchain (flat aliases kept for backward compat)
  stellarNetwork: network,
  stellarHorizonUrl: horizonUrl,
  stellarSecretKey: env.STELLAR_SECRET_KEY,
  stellar: {
    network,
    horizonUrl,
    secretKey: env.STELLAR_SECRET_KEY,
    platformPublicKey: env.STELLAR_PLATFORM_PUBLIC_KEY,
  },

  // Payment Assets
  supportedAssets: env.SUPPORTED_ASSETS
    .split(',')
    .map((a) => a.trim().toUpperCase())
    .filter(Boolean),

  // Stellar Service
  stellarServiceUrl: env.STELLAR_SERVICE_URL,

  // AI/LLM
  geminiApiKey: env.GEMINI_API_KEY,

  // PHI Field-Level Encryption
  fieldEncryptionKey: env.FIELD_ENCRYPTION_KEY,
};
