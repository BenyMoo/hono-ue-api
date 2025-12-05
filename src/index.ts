import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { cors } from 'hono/cors';
import { etag } from 'hono/etag';
import { swaggerUI } from '@hono/swagger-ui';
import { createDb } from './db';
import { getRedis } from './utils/redis';
import { getConfig } from './config/index';
import type { HonoEnv } from './types/index';
import { openApiSpec } from './openapi';

// Import routes
import routes from './routes';

// 创建 Hono 应用并设置正确的类型
const app = new Hono<HonoEnv>();

// 全局中间件
app.use('*', logger());     // 日志中间件
app.use('*', cors());      // CORS 中间件
app.use('*', etag());      // ETag 中间件

// 数据库和 Redis 中间件
app.use('*', async (c, next) => {
  try {
    // 从 Hono 上下文获取配置（wrangler.jsonc 中的变量）
    const config = getConfig(c);
    
    // 初始化数据库
    const db = createDb(config.database.url);
    c.set('db', db);
    
    // 初始化 Redis - 优雅处理连接错误
    try {
      const redis = getRedis(config.redis.url, config.redis.token);
      c.set('redis', redis);
    } catch (redisError) {
      console.warn('Redis 初始化警告:', redisError);
      // 继续运行，不依赖 Redis - 基础功能可选
      c.set('redis', null);
    }
    
    await next();
  } catch (error) {
    console.error('配置错误:', error);
    return c.json({ error: '系统配置错误' }, 500);
  }
});

// 健康检查端点
app.get('/', (c) => {
  return c.json({ 
    message: '连接正常',
    timestamp: new Date().toISOString()
  });
});

// API 路由
app.route('/api', routes);

// API 文档界面
app.get('/ui', swaggerUI({ url: '/doc' }));

// OpenAPI JSON 端点
app.get('/doc', (c) => {
  return c.json(openApiSpec);
});

// 404 处理
app.notFound((c) => {
  return c.json({ error: 'Not Found' }, 404);
});

// 错误处理
app.onError((err, c) => {
  console.error(`${err}`);
  return c.json({ error: 'Internal Server Error' }, 500);
});

export default app;
