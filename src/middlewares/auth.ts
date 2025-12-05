import { createMiddleware } from 'hono/factory';
import { verify } from 'hono/jwt';
import type { HonoEnv } from '../types';

export const authMiddleware = createMiddleware<HonoEnv>(async (c, next) => {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: '未授权访问' }, 401);
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return c.json({ error: '无效的令牌' }, 401);
  }

  try {
    const payload = await verify(token, c.env.JWT_SECRET);
    c.set('user', payload);
    await next();
  } catch (error) {
    return c.json({ error: '令牌验证失败' }, 401);
  }
});
