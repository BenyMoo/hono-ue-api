import { Hono } from 'hono';
import { eq, sql } from 'drizzle-orm';
import { users } from '../db/schema';
import { authMiddleware } from '../middlewares/auth';
import { HonoEnv } from '../types';
import {
    cacheMembershipStatus,
    getCachedMembershipStatus,
    invalidateUserCache
} from '../utils/redis-cache';
import { getBeijingTime, addDaysToBeijingDate } from '../utils/datetime';

const membership = new Hono<HonoEnv>();

membership.use('*', authMiddleware);

const MEMBERSHIP_COST = 100;
const MEMBERSHIP_DURATION_DAYS = 7;

membership.post('/redeem', async (c) => {
    const userPayload = c.get('user');
    const userId = userPayload.sub;
    const db = c.get('db');

    console.log(`📝 [API] 会员兑换请求 | User: ${userId}`);

    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (user.length === 0) {
        console.log(`⚠ [WARN] 用户不存在 | User: ${userId}`);
        return c.json({ error: '用户不存在' }, 404);
    }
    const currentUser = user[0];

    if (currentUser.points < MEMBERSHIP_COST) {
        console.log(`⚠ [WARN] 积分不足 | User: ${userId} | Points: ${currentUser.points} | Required: ${MEMBERSHIP_COST}`);
        return c.json({ error: `积分不足，需要 ${MEMBERSHIP_COST} 积分` }, 400);
    }

    const now = getBeijingTime(); // 使用北京时间
    let newExpireAt = getBeijingTime();

    if (currentUser.is_member && currentUser.member_expire_at && currentUser.member_expire_at > now) {
        // 延长现有会员
        newExpireAt = addDaysToBeijingDate(new Date(currentUser.member_expire_at), MEMBERSHIP_DURATION_DAYS);
        console.log(`📅 [INFO] 延长会员 | User: ${userId} | New Expire: ${newExpireAt.toISOString()}`);
    } else {
        // 新会员
        newExpireAt = addDaysToBeijingDate(now, MEMBERSHIP_DURATION_DAYS);
        console.log(`🆕 [INFO] 新会员 | User: ${userId} | Expire: ${newExpireAt.toISOString()}`);
    }

    try {
        await db.transaction(async (tx) => {
            await tx.update(users)
                .set({
                    points: sql`${users.points} - ${MEMBERSHIP_COST}`,
                    is_member: true,
                    member_expire_at: newExpireAt,
                })
                .where(eq(users.id, userId));
        });

        // 清除会员缓存
        await invalidateUserCache(userId);

        console.log(`✅ [SUCCESS] 会员兑换成功 | User: ${userId} | Points: ${currentUser.points - MEMBERSHIP_COST}`);
        return c.json({
            message: '会员兑换成功',
            expireAt: newExpireAt.toISOString(),
            remainingPoints: currentUser.points - MEMBERSHIP_COST,
            durationDays: MEMBERSHIP_DURATION_DAYS
        });
    } catch (e) {
        console.error('❌ [ERROR] 会员兑换错误:', e);
        return c.json({ error: '兑换失败' }, 500);
    }
});

membership.get('/status', async (c) => {
    const userPayload = c.get('user');
    const userId = userPayload.sub;
    const db = c.get('db');

    console.log(`📝 [API] 获取会员状态 | User: ${userId}`);

    // 首先检查Redis缓存
    const cachedStatus = await getCachedMembershipStatus(userId);
    if (cachedStatus) {
        return c.json(cachedStatus);
    }

    console.log(`✗ [CACHE MISS] 会员状态缓存未命中，查询数据库 | User: ${userId}`);

    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (user.length === 0) {
        return c.json({ error: '用户不存在' }, 404);
    }
    const currentUser = user[0];

    const now = getBeijingTime(); // 使用北京时间
    const isExpired = currentUser.member_expire_at ? new Date(currentUser.member_expire_at) < now : true;
    const isMember = currentUser.is_member && !isExpired;

    const membershipStatus = {
        isMember,
        points: currentUser.points,
        expireAt: currentUser.member_expire_at,
        nickname: currentUser.nickname,
        avatar: currentUser.avatar
    };

    // 缓存会员状态
    await cacheMembershipStatus(userId, membershipStatus);

    return c.json(membershipStatus);
});

// 获取会员兑换记录
membership.get('/redeem-history', async (c) => {
    const userPayload = c.get('user');
    const userId = userPayload.sub;
    const db = c.get('db');
    const redis = c.get('redis');

    console.log(`📝 [API] 获取会员兑换历史 | User: ${userId}`);

    try {
        // 检查缓存
        const cacheKey = `membership:history:${userId}`;
        if (redis) {
            const cached = await redis.get(cacheKey);
            if (cached) {
                console.log(`✓ [CACHE HIT] 会员历史来自缓存 | User: ${userId}`);
                return c.json(typeof cached === 'string' ? JSON.parse(cached) : cached);
            }
        }

        console.log(`✗ [CACHE MISS] 会员历史缓存未命中，查询数据库 | User: ${userId}`);

        // 这里可以查询 membership_redeem_log 表
        // 目前返回用户的基本会员信息
        const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
        if (user.length === 0) {
            return c.json({ error: '用户不存在' }, 404);
        }

        const currentUser = user[0];
        const now = getBeijingTime(); // 使用北京时间
        const isExpired = currentUser.member_expire_at ? new Date(currentUser.member_expire_at) < now : true;
        const isMember = currentUser.is_member && !isExpired;

        const result = {
            currentMember: {
                isMember,
                expireAt: currentUser.member_expire_at,
                points: currentUser.points
            },
            history: [] // 可以扩展查询历史记录
        };

        // 缓存结果（5分钟）
        if (redis) {
            await redis.setex(cacheKey, 300, JSON.stringify(result));
            console.log(`💾 [CACHE SET] 会员历史已缓存 | User: ${userId}`);
        }

        return c.json(result);
    } catch (e) {
        console.error('❌ [ERROR] 获取会员历史错误:', e);
        return c.json({ error: '获取会员历史失败' }, 500);
    }
});

export default membership;
