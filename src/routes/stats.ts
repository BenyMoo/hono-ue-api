import { Hono } from 'hono';
import { eq, and, sql, desc, count, sum } from 'drizzle-orm';
import { users, checkins } from '../db/schema';
import { authMiddleware } from '../middlewares/auth';
import { HonoEnv } from '../types';
import {
    getCachedUserStats,
    cacheUserStats,
    getCachedLeaderboard,
    cacheLeaderboard
} from '../utils/redis-cache';

const stats = new Hono<HonoEnv>();

stats.use('*', authMiddleware);

// 获取用户统计信息
stats.get('/user', async (c) => {
    const user = c.get('user');
    const userId = user.sub;
    const db = c.get('db');

    console.log(`📝 [API] 获取用户统计 | User: ${userId}`);

    // 检查Redis缓存
    const cachedStats = await getCachedUserStats(userId);
    if (cachedStats) {
        return c.json(cachedStats);
    }

    console.log(`✗ [CACHE MISS] 用户统计缓存未命中,查询数据库 | User: ${userId}`);

    try {
        // 获取用户信息
        const userInfo = await db.select({
            id: users.id,
            email: users.email,
            nickname: users.nickname,
            avatar: users.avatar,
            points: users.points,
            isMember: users.is_member,
            memberExpireAt: users.member_expire_at,
            createdAt: users.created_at
        })
            .from(users)
            .where(eq(users.id, userId))
            .limit(1);

        if (userInfo.length === 0) {
            return c.json({ error: '用户不存在' }, 404);
        }

        // 获取签到统计
        const checkinStats = await db.select({
            totalCheckins: count(checkins.id),
            totalPointsEarned: sum(checkins.pointsEarned),
            lastCheckinDate: sql`MAX(${checkins.checkinDate})`
        })
            .from(checkins)
            .where(eq(checkins.userId, userId));

        const userData = userInfo[0];
        const checkinData = checkinStats[0];

        // 检查会员状态
        const isExpired = userData.memberExpireAt ? new Date(userData.memberExpireAt) < new Date() : true;
        const isMember = userData.isMember && !isExpired;

        const stats = {
            user: {
                id: userData.id,
                email: userData.email,
                nickname: userData.nickname,
                avatar: userData.avatar,
                points: userData.points,
                isMember,
                memberExpireAt: userData.memberExpireAt,
                createdAt: userData.createdAt
            },
            checkin: {
                totalCheckins: Number(checkinData.totalCheckins) || 0,
                totalPointsEarned: Number(checkinData.totalPointsEarned) || 0,
                lastCheckinDate: checkinData.lastCheckinDate
            },
            membership: {
                status: isMember ? 'active' : 'inactive',
                expireAt: userData.memberExpireAt
            }
        };

        // 缓存结果
        await cacheUserStats(userId, stats);

        return c.json(stats);
    } catch (e) {
        console.error('❌ [ERROR] 获取用户统计错误:', e);
        return c.json({ error: '获取用户统计失败' }, 500);
    }
});

// 获取积分排行榜
stats.get('/leaderboard', async (c) => {
    const db = c.get('db');
    const limit = Math.min(parseInt(c.req.query('limit') || '10'), 100); // 最多100条

    console.log(`📝 [API] 获取排行榜 | Limit: ${limit}`);

    // 检查Redis缓存
    const cachedLeaderboard = await getCachedLeaderboard();
    if (cachedLeaderboard) {
        return c.json({
            leaderboard: cachedLeaderboard.slice(0, limit),
            totalCount: cachedLeaderboard.length
        });
    }

    console.log(`✗ [CACHE MISS] 排行榜缓存未命中，查询数据库`);

    try {
        // 获取积分排行榜
        const leaderboard = await db.select({
            userId: users.id,
            nickname: users.nickname,
            avatar: users.avatar,
            points: users.points,
            isMember: users.is_member,
            memberExpireAt: users.member_expire_at
        })
            .from(users)
            .orderBy(desc(users.points))
            .limit(100); // 获取前100名

        // 格式化排行榜数据
        const formattedLeaderboard = leaderboard.map((user, index) => ({
            rank: index + 1,
            userId: user.userId,
            nickname: user.nickname,
            avatar: user.avatar,
            points: user.points,
            isMember: user.isMember && (user.memberExpireAt ? new Date(user.memberExpireAt) > new Date() : false)
        }));

        // 缓存结果
        await cacheLeaderboard(formattedLeaderboard);

        return c.json({
            leaderboard: formattedLeaderboard.slice(0, limit),
            totalCount: formattedLeaderboard.length
        });
    } catch (e) {
        console.error('❌ [ERROR] 获取排行榜错误:', e);
        return c.json({ error: '获取排行榜失败' }, 500);
    }
});

// 获取系统统计信息（管理员功能，可以添加权限检查）
stats.get('/system', async (c) => {
    const db = c.get('db');
    const redis = c.get('redis');

    console.log(`📝 [API] 获取系统统计`);

    try {
        // 检查缓存
        const cacheKey = 'stats:system';
        if (redis) {
            const cached = await redis.get(cacheKey);
            if (cached) {
                console.log(`✓ [CACHE HIT] 系统统计来自缓存`);
                return c.json(typeof cached === 'string' ? JSON.parse(cached) : cached);
            }
        }

        console.log(`✗ [CACHE MISS] 系统统计缓存未命中，查询数据库`);

        // 获取系统总体统计
        const userStats = await db.select({
            totalUsers: count(users.id),
            totalMembers: sql`COUNT(CASE WHEN ${users.is_member} = 1 AND ${users.member_expire_at} > NOW() THEN 1 END)`,
            totalPoints: sum(users.points),
            avgPoints: sql`AVG(${users.points})`
        })
            .from(users);

        const checkinStats = await db.select({
            totalCheckins: count(checkins.id),
            todayCheckins: sql`COUNT(CASE WHEN ${checkins.checkinDate} = CURDATE() THEN 1 END)`,
            totalPointsEarned: sum(checkins.pointsEarned)
        })
            .from(checkins);

        const userData = userStats[0];
        const checkinData = checkinStats[0];

        const result = {
            users: {
                totalUsers: Number(userData.totalUsers) || 0,
                totalMembers: Number(userData.totalMembers) || 0,
                totalPoints: Number(userData.totalPoints) || 0,
                avgPoints: Math.round(Number(userData.avgPoints) || 0)
            },
            checkins: {
                totalCheckins: Number(checkinData.totalCheckins) || 0,
                todayCheckins: Number(checkinData.todayCheckins) || 0,
                totalPointsEarned: Number(checkinData.totalPointsEarned) || 0
            }
        };

        // 缓存结果（5分钟）
        if (redis) {
            await redis.setex(cacheKey, 300, JSON.stringify(result));
            console.log(`💾 [CACHE SET] 系统统计已缓存`);
        }

        return c.json(result);
    } catch (e) {
        console.error('❌ [ERROR] 获取系统统计错误:', e);
        return c.json({ error: '获取系统统计失败' }, 500);
    }
});

export default stats;