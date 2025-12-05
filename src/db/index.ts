import { drizzle } from 'drizzle-orm/tidb-serverless';
import { connect } from '@tidbcloud/serverless';
import * as schema from './schema';

export const createDb = (databaseUrl: string) => {
    const client = connect({ url: databaseUrl });
    return drizzle(client, { schema });
};

export type Database = ReturnType<typeof createDb>;
