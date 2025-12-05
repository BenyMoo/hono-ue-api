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

    // 检查Redis缓存
    const cachedStats = await getCachedUserStats(userId);
    if (cachedStats) {
        return c.json(cachedStats);
    }

    try {
        // 获取用户信息
        const userInfo = await db.select({
            id: users.id,
            email: users.email,
            nickname: users.nickname,
            avatar: users.avatar,
            points: users.points,
            isMember: users.isMember,
            memberExpireAt: users.memberExpireAt,
            createdAt: users.createdAt
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
                totalCheckins: checkinData.totalCheckins || 0,
                totalPointsEarned: checkinData.totalPointsEarned || 0,
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
        console.error('获取用户统计错误:', e);
        return c.json({ error: '获取用户统计失败' }, 500);
    }
});

// 获取积分排行榜
stats.get('/leaderboard', async (c) => {
    const db = c.get('db');
    const limit = Math.min(parseInt(c.req.query('limit') || '10'), 100); // 最多100条

    // 检查Redis缓存
    const cachedLeaderboard = await getCachedLeaderboard();
    if (cachedLeaderboard) {
        return c.json({
            leaderboard: cachedLeaderboard.slice(0, limit),
            totalCount: cachedLeaderboard.length
        });
    }

    try {
        // 获取积分排行榜
        const leaderboard = await db.select({
            userId: users.id,
            nickname: users.nickname,
            avatar: users.avatar,
            points: users.points,
            isMember: users.isMember,
            memberExpireAt: users.memberExpireAt
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
        console.error('获取排行榜错误:', e);
        return c.json({ error: '获取排行榜失败' }, 500);
    }
});

// 获取系统统计信息（管理员功能，可以添加权限检查）
stats.get('/system', async (c) => {
    const db = c.get('db');

    try {
        // 获取系统总体统计
        const userStats = await db.select({
            totalUsers: count(users.id),
            totalMembers: sql`COUNT(CASE WHEN ${users.isMember} = 1 AND ${users.memberExpireAt} > NOW() THEN 1 END)`,
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

        return c.json({
            users: {
                totalUsers: userData.totalUsers,
                totalMembers: userData.totalMembers || 0,
                totalPoints: userData.totalPoints || 0,
                avgPoints: Math.round(userData.avgPoints || 0)
            },
            checkins: {
                totalCheckins: checkinData.totalCheckins || 0,
                todayCheckins: checkinData.todayCheckins || 0,
                totalPointsEarned: checkinData.totalPointsEarned || 0
            }
        });
    } catch (e) {
        console.error('获取系统统计错误:', e);
        return c.json({ error: '获取系统统计失败' }, 500);
    }
});

export default stats;