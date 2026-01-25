import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { config } from '../src/config/db/schema';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL is not set');
  process.exit(1);
}

const client = postgres(DATABASE_URL);
const db = drizzle(client);

async function initOAuthConfigs() {
  console.log('🚀 Starting OAuth configuration...\n');

  const oauthConfigs = [
    { name: 'google_auth_enabled', value: 'true' },
    { name: 'google_one_tap_enabled', value: 'true' },
    { name: 'google_client_id', value: process.env.AUTH_GOOGLE_ID || '' },
    { name: 'google_client_secret', value: process.env.AUTH_GOOGLE_SECRET || '' },
    { name: 'github_auth_enabled', value: 'true' },
    { name: 'github_client_id', value: process.env.AUTH_GITHUB_ID || '' },
    { name: 'github_client_secret', value: process.env.AUTH_GITHUB_SECRET || '' },
    { name: 'email_auth_enabled', value: 'true' },
  ];

  console.log('📝 Setting OAuth configurations...');

  for (const cfg of oauthConfigs) {
    try {
      await db
        .insert(config)
        .values({ name: cfg.name, value: cfg.value })
        .onConflictDoUpdate({
          target: config.name,
          set: { value: cfg.value },
        });

      // Don't log secrets
      const displayValue = cfg.name.includes('secret') ? '***' : cfg.value;
      console.log(`   ✓ Set ${cfg.name} = ${displayValue}`);
    } catch (error) {
      console.error(`   ✗ Failed to set ${cfg.name}:`, error);
    }
  }

  console.log('\n✅ OAuth configuration completed!');
  console.log('\n💡 OAuth login buttons should now appear on the sign-in page.');

  await client.end();
}

initOAuthConfigs().catch(console.error);
