import { createMiddleware } from 'hono/factory';
import { verify } from 'hono/jwt';

export const authMiddleware = createMiddleware(async (c, next) => {
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
        return c.json({ error: '未授权访问 (Unauthorized)' }, 401);
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        return c.json({ error: '无效的令牌 (Invalid Token)' }, 401);
    }

    try {
        const payload = await verify(token, c.env.JWT_SECRET || 'supersecretkey');
        c.set('user', payload);
        await next();
    } catch (e) {
        return c.json({ error: '令牌验证失败 (Token Verification Failed)' }, 401);
    }
});
