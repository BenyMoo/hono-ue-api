import { Hono } from 'hono';
import { eq, and, sql, desc } from 'drizzle-orm';
import { checkins, users } from '../db/schema';
import { authMiddleware } from '../middlewares/auth';
import { HonoEnv } from '../types';
import { 
  cacheUserCheckinStatus, 
  getCachedCheckinStatus, 
  cacheUserInfo, 
  invalidateUserCache 
} from '../utils/redis-cache';

const checkin = new Hono<HonoEnv>();

checkin.use('*', authMiddleware);

checkin.post('/', async (c) => {
    const user = c.get('user');
    const userId = user.sub;
    const db = c.get('db');
    const todayStr = new Date().toISOString().split('T')[0];
    const todayDate = new Date(todayStr);
    const pointsReward = 10; // 每日签到积分

    // 首先检查Redis缓存
    const cachedStatus = await getCachedCheckinStatus(userId, todayStr);
    if (cachedStatus === true) {
        return c.json({ error: '今天已经签到过了' }, 400);
    }

    // 检查数据库
    const existingCheckin = await db.select()
        .from(checkins)
        .where(and(
            eq(checkins.userId, userId),
            eq(checkins.checkinDate, todayDate)
        ))
        .limit(1);

    if (existingCheckin.length > 0) {
        // 缓存结果
        await cacheUserCheckinStatus(userId, todayStr, true);
        return c.json({ error: '今天已经签到过了' }, 400);
    }

    try {
        // 使用事务确保数据一致性
        await db.transaction(async (tx) => {
            // 插入签到记录
            await tx.insert(checkins).values({
                userId,
                checkinDate: todayDate,
                pointsEarned: pointsReward,
            });

            // 更新用户积分
            await tx.update(users)
                .set({ points: sql`${users.points} + ${pointsReward}` })
                .where(eq(users.id, userId));
        });

        // 缓存签到状态
        await cacheUserCheckinStatus(userId, todayStr, true);
        
        // 清除用户缓存
        await invalidateUserCache(userId);

        return c.json({ 
            message: '签到成功', 
            pointsEarned: pointsReward,
            checkinDate: todayStr
        });
    } catch (e) {
        console.error('签到错误:', e);
        return c.json({ error: '签到失败' }, 500);
    }
});

// 获取用户签到记录
checkin.get('/history', async (c) => {
    const user = c.get('user');
    const userId = user.sub;
    const db = c.get('db');
    
    try {
        const history = await db.select({
            id: checkins.id,
            checkinDate: checkins.checkinDate,
            pointsEarned: checkins.pointsEarned,
            createdAt: checkins.createdAt
        })
        .from(checkins)
        .where(eq(checkins.userId, userId))
        .orderBy(desc(checkins.checkinDate))
        .limit(30);

        return c.json({
            history,
            totalCount: history.length
        });
    } catch (e) {
        console.error('获取签到历史错误:', e);
        return c.json({ error: '获取签到历史失败' }, 500);
    }
});

// 获取用户今日签到状态
checkin.get('/status', async (c) => {
    const user = c.get('user');
    const userId = user.sub;
    const todayStr = new Date().toISOString().split('T')[0];
    
    try {
        // 检查Redis缓存
        const cachedStatus = await getCachedCheckinStatus(userId, todayStr);
        if (cachedStatus !== null) {
            return c.json({
                checkedIn: cachedStatus,
                checkinDate: todayStr
            });
        }

        // 查询数据库
        const db = c.get('db');
        const todayDate = new Date(todayStr);
        const existingCheckin = await db.select()
            .from(checkins)
            .where(and(
                eq(checkins.userId, userId),
                eq(checkins.checkinDate, todayDate)
            ))
            .limit(1);

        const checkedIn = existingCheckin.length > 0;
        
        // 缓存结果
        await cacheUserCheckinStatus(userId, todayStr, checkedIn);

        return c.json({
            checkedIn,
            checkinDate: todayStr
        });
    } catch (e) {
        console.error('获取签到状态错误:', e);
        return c.json({ error: '获取签到状态失败' }, 500);
    }
});

export default checkin;
