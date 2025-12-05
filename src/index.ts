import { OpenAPIHono } from '@hono/zod-openapi';
import { apiReference } from '@scalar/hono-api-reference';
import auth from './routes/auth';
import checkin from './routes/checkin';
import membership from './routes/membership';
import { HonoEnv } from './types';
import { createDb } from './db';

const app = new OpenAPIHono<HonoEnv>();

app.use(async (c, next) => {
  const db = createDb(c.env.DATABASE_URL);
  console.log('DB URL:', c.env.DATABASE_URL?.replace(/:[^:@]+@/, ':***@')); // Log masked URL
  c.set('db', db);
  await next();
});

app.get('/', (c) => {
  return c.text('连接正常');
});

// Mount routes
app.route('/auth', auth);
app.route('/checkin', checkin as any);
app.route('/membership', membership as any);

// OpenAPI Docs
app.doc('/doc', {
  openapi: '3.0.0',
  info: {
    version: '1.0.0',
    title: 'Hono UE API',
  },
});

app.get(
  '/ui',
  apiReference({
    spec: {
      url: '/doc',
    },
  } as any)
);

export default app;
