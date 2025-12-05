import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { sign } from 'hono/jwt';
import { eq } from 'drizzle-orm';
import { users } from '../db/schema';
import { hashPassword, verifyPassword } from '../utils/password';
import { HonoEnv } from '../types';
import { cachedQuery } from '../utils/query-helper';
import { CACHE_PREFIXES, CACHE_TTL } from '../utils/redis-cache';

const auth = new OpenAPIHono<HonoEnv>();

const registerSchema = z.object({
    email: z.string().email().openapi({ example: 'user@example.com' }),
    password: z.string().min(6).openapi({ example: 'password123' }),
    nickname: z.string().optional().openapi({ example: 'User' }),
});

const loginSchema = z.object({
    email: z.string().email().openapi({ example: 'user@example.com' }),
    password: z.string().openapi({ example: 'password123' }),
});

const registerRoute = createRoute({
    method: 'post',
    path: '/register',
    tags: ['Auth'],
    summary: 'User Registration',
    request: {
        body: {
            content: {
                'application/json': {
                    schema: registerSchema,
                },
            },
        },
    },
    responses: {
        201: {
            content: {
                'application/json': {
                    schema: z.object({
                        message: z.string(),
                    }),
                },
            },
            description: 'Registration successful',
        },
        400: {
            content: {
                'application/json': {
                    schema: z.object({
                        error: z.string(),
                    }),
                },
            },
            description: 'Validation error or User exists',
        },
        500: {
            content: {
                'application/json': {
                    schema: z.object({
                        error: z.string(),
                    }),
                },
            },
            description: 'Server error',
        },
    },
});

const loginRoute = createRoute({
    method: 'post',
    path: '/login',
    tags: ['Auth'],
    summary: 'User Login',
    request: {
        body: {
            content: {
                'application/json': {
                    schema: loginSchema,
                },
            },
        },
    },
    responses: {
        200: {
            content: {
                'application/json': {
                    schema: z.object({
                        token: z.string(),
                        user: z.object({
                            id: z.number(),
                            email: z.string(),
                            nickname: z.string().nullable(),
                        }),
                    }),
                },
            },
            description: 'Login successful',
        },
        401: {
            content: {
                'application/json': {
                    schema: z.object({
                        error: z.string(),
                    }),
                },
            },
            description: 'Invalid credentials',
        },
        500: {
            content: {
                'application/json': {
                    schema: z.object({
                        error: z.string(),
                    }),
                },
            },
            description: 'Server error',
        },
    },
});

auth.openapi(registerRoute, async (c) => {
    const { email, password, nickname } = c.req.valid('json');
    const db = c.get('db');
    const redis = c.get('redis');

    console.log(`📝 [API] 注册请求 | Email: ${email}`);

    try {
        const query = db.select().from(users).where(eq(users.email, email)).limit(1);
        const cacheKey = `${CACHE_PREFIXES.USER}email:${email}`;

        const existingUser = await cachedQuery({
            redis,
            key: cacheKey,
            ttl: CACHE_TTL.USER
        }, query);

        if (existingUser.length > 0) {
            console.log(`⚠ [WARN] 邮箱已被注册 | Email: ${email}`);
            return c.json({ error: '邮箱已被注册 (Email already registered)' }, 400);
        }

        const hashedPassword = await hashPassword(password);

        await db.insert(users).values({
            email,
            password_hash: hashedPassword,
            nickname: nickname || email.split('@')[0],
        });

        // Invalidate cache after registration to ensure next check finds the user
        if (redis) {
            await redis.del(cacheKey);
            console.log(`🗑️ [CACHE INVALIDATE] 注册后清除缓存 | Email: ${email}`);
        }

        console.log(`✅ [SUCCESS] 注册成功 | Email: ${email}`);
        return c.json({ message: '注册成功 (Registration successful)' }, 201);
    } catch (e: any) {
        console.error('❌ [ERROR] 注册错误:', JSON.stringify(e, null, 2));
        return c.json({ error: `注册失败: ${e.message} (Cause: ${e.cause ? JSON.stringify(e.cause) : 'Unknown'})` }, 500);
    }
});

auth.openapi(loginRoute, async (c) => {
    const { email, password } = c.req.valid('json');
    const db = c.get('db');
    const redis = c.get('redis');

    console.log(`📝 [API] 登录请求 | Email: ${email}`);

    try {
        const query = db.select().from(users).where(eq(users.email, email)).limit(1);
        const cacheKey = `${CACHE_PREFIXES.USER}email:${email}`;

        const user = await cachedQuery({
            redis,
            key: cacheKey,
            ttl: CACHE_TTL.USER
        }, query);

        if (user.length === 0) {
            console.log(`⚠ [WARN] 用户不存在 | Email: ${email}`);
            return c.json({ error: '用户不存在或密码错误 (Invalid credentials)' }, 401);
        }

        const isValid = await verifyPassword(password, user[0].password_hash);
        if (!isValid) {
            console.log(`⚠ [WARN] 密码错误 | Email: ${email}`);
            return c.json({ error: '用户不存在或密码错误 (Invalid credentials)' }, 401);
        }

        const payload = {
            sub: user[0].id,
            email: user[0].email,
            exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7 days
        };

        const token = await sign(payload, c.env.JWT_SECRET || 'supersecretkey');

        console.log(`✅ [SUCCESS] 登录成功 | Email: ${email} | User ID: ${user[0].id}`);
        return c.json({ token, user: { id: user[0].id, email: user[0].email, nickname: user[0].nickname } }, 200);
    } catch (e: any) {
        console.error('❌ [ERROR] 登录错误:', JSON.stringify(e, null, 2));
        return c.json({ error: `登录失败: ${e.message} (Cause: ${e.cause ? JSON.stringify(e.cause) : 'Unknown'})` }, 500);
    }
});

export default auth;
