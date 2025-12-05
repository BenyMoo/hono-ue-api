import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { cors } from 'hono/cors';
import { etag } from 'hono/etag';
import { swaggerUI } from '@hono/swagger-ui';
import { createDb } from './db';
import type { HonoEnv } from './types';
import { openApiSpec } from './openapi';

// Import routes
import routes from './routes';

// Create Hono app with proper typing
const app = new Hono<HonoEnv>();

// Global middleware
app.use('*', logger());
app.use('*', cors());
app.use('*', etag());

// Database middleware
app.use('*', async (c, next) => {
  if (!c.env.DATABASE_URL) {
    console.error('DATABASE_URL is not defined in environment variables');
    return c.json({ error: '数据库配置错误' }, 500);
  }
  
  try {
    const db = createDb(c.env.DATABASE_URL);
    c.set('db', db);
    await next();
  } catch (error) {
    console.error('Database connection error:', error);
    return c.json({ error: '数据库连接失败' }, 500);
  }
});

// Health check endpoint
app.get('/', (c) => {
  return c.json({ 
    message: '连接正常',
    timestamp: new Date().toISOString()
  });
});

// API routes
app.route('/api', routes);

// API Documentation
app.get('/ui', swaggerUI({ url: '/doc' }));

// OpenAPI JSON endpoint
app.get('/doc', (c) => {
  return c.json(openApiSpec);
});

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not Found' }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error(`${err}`);
  return c.json({ error: 'Internal Server Error' }, 500);
});

export default app;
