import 'dotenv/config';
import { neon, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { drizzle as pgDrizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

// Configure Neon for different environments
let db, sql;

if (process.env.USE_NEON_LOCAL === 'true') {
    // Development with Neon Local - use postgres driver
    console.log('Using Neon Local (postgres driver)');
    const client = postgres(process.env.DATABASE_URL, {
        ssl: {
            rejectUnauthorized: false, // Allow self-signed certificates for Neon Local
        },
    });
    db = pgDrizzle(client);
    sql = client;
} else {
    // Production with Neon serverless driver
    console.log('Using Neon Cloud (serverless driver)');

    // Configure Neon for serverless in case we're using Neon Local in Docker
    if (
        process.env.NODE_ENV === 'development' &&
        process.env.DATABASE_URL.includes('neon-local')
    ) {
        neonConfig.fetchEndpoint = 'http://neon-local:5432/sql';
        neonConfig.useSecureWebSocket = false;
        neonConfig.poolQueryViaFetch = true;
    }

    sql = neon(process.env.DATABASE_URL);
    db = drizzle(sql);
}

export { db, sql };
