import { Hono } from 'hono';
import { eq, sql } from 'drizzle-orm';
import { users } from '../db/schema';
import { authMiddleware } from '../middlewares/auth';
import { HonoEnv } from '../types';

const membership = new Hono<HonoEnv>();

membership.use('*', authMiddleware);

const MEMBERSHIP_COST = 100;
const MEMBERSHIP_DURATION_DAYS = 7;

membership.post('/redeem', async (c) => {
    const userPayload = c.get('user');
    const userId = userPayload.sub;
    const db = c.get('db');

    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (user.length === 0) {
        return c.json({ error: '用户不存在 (User not found)' }, 404);
    }
    const currentUser = user[0];

    if (currentUser.points < MEMBERSHIP_COST) {
        return c.json({ error: `积分不足，需要 ${MEMBERSHIP_COST} 积分 (Insufficient points)` }, 400);
    }

    const now = new Date();
    let newExpireAt = new Date();

    if (currentUser.is_member && currentUser.member_expire_at && currentUser.member_expire_at > now) {
        // Extend existing membership
        newExpireAt = new Date(currentUser.member_expire_at);
        newExpireAt.setDate(newExpireAt.getDate() + MEMBERSHIP_DURATION_DAYS);
    } else {
        // New membership
        newExpireAt.setDate(now.getDate() + MEMBERSHIP_DURATION_DAYS);
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

        return c.json({
            message: '会员兑换成功 (Membership redeemed successfully)',
            expireAt: newExpireAt.toISOString(),
            remainingPoints: currentUser.points - MEMBERSHIP_COST
        });
    } catch (e) {
        console.error('Membership redeem error:', e);
        return c.json({ error: '兑换失败 (Redemption failed)' }, 500);
    }
});

membership.get('/status', async (c) => {
    const userPayload = c.get('user');
    const userId = userPayload.sub;
    const db = c.get('db');

    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (user.length === 0) {
        return c.json({ error: '用户不存在 (User not found)' }, 404);
    }
    const currentUser = user[0];

    const isExpired = currentUser.member_expire_at ? new Date(currentUser.member_expire_at) < new Date() : true;
    const isMember = currentUser.is_member && !isExpired;

    return c.json({
        isMember,
        points: currentUser.points,
        expireAt: currentUser.member_expire_at,
        nickname: currentUser.nickname,
        avatar: currentUser.avatar
    });
});

export default membership;
