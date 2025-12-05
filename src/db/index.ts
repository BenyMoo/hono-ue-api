import { drizzle } from 'drizzle-orm/tidb-serverless';
import { connect } from '@tidbcloud/serverless';
import * as schema from './schema';

// Initialize the connection
const client = connect({
    url: process.env.DATABASE_URL,
});

export const db = drizzle(client, { schema });
