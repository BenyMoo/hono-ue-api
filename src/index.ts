import { OpenAPIHono } from '@hono/zod-openapi';
import { apiReference } from '@scalar/hono-api-reference';
import auth from './routes/auth';
import checkin from './routes/checkin';
import membership from './routes/membership';
import { HonoEnv } from './types';
import { createDb } from './db';

const app = new OpenAPIHono<HonoEnv>();

app.use(async (c, next) => {
  if (!c.env.DATABASE_URL) {
    console.error('DATABASE_URL is not defined in environment variables');
    return c.json({ error: '数据库配置错误 (Database configuration error)' }, 500);
  }
  
  try {
    const db = createDb(c.env.DATABASE_URL);
    console.log('DB URL:', c.env.DATABASE_URL?.replace(/:[^:@]+@/, ':***@')); // Log masked URL
    c.set('db', db);
    await next();
  } catch (error) {
    console.error('Database connection error:', error);
    return c.json({ error: '数据库连接失败 (Database connection failed)' }, 500);
  }
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
