import { drizzle } from 'drizzle-orm/tidb-serverless';
import { connect } from '@tidbcloud/serverless';
import * as schema from './schema';

export const createDb = (url: string) => {
    const client = connect({ url });
    return drizzle(client, { schema });
};

export type Database = ReturnType<typeof createDb>;
