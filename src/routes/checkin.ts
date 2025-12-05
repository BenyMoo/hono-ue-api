import { Hono } from 'hono';
import { eq, and, sql } from 'drizzle-orm';
import { checkins, users } from '../db/schema';
import { authMiddleware } from '../middlewares/auth';
import { HonoEnv } from '../types';

const checkin = new Hono<HonoEnv>();

checkin.use('*', authMiddleware);

checkin.post('/', async (c) => {
    const user = c.get('user');
    const userId = user.sub;
    const db = c.get('db');
    const todayStr = new Date().toISOString().split('T')[0];
    const todayDate = new Date(todayStr);
    const pointsReward = 10; // Daily check-in points

    // Check if already checked in
    const existingCheckin = await db.select()
        .from(checkins)
        .where(and(
            eq(checkins.userId, userId),
            eq(checkins.checkinDate, todayDate)
        ))
        .limit(1);

    if (existingCheckin.length > 0) {
        return c.json({ error: '今天已经签到过了 (Already checked in today)' }, 400);
    }

    try {
        // Transaction to ensure consistency
        await db.transaction(async (tx) => {
            await tx.insert(checkins).values({
                userId,
                checkinDate: todayDate,
                pointsEarned: pointsReward,
            });

            await tx.update(users)
                .set({ points: sql`${users.points} + ${pointsReward}` })
                .where(eq(users.id, userId));
        });

        return c.json({ message: '签到成功 (Check-in successful)', pointsEarned: pointsReward });
    } catch (e) {
        console.error('Checkin error:', e);
        return c.json({ error: '签到失败 (Check-in failed)' }, 500);
    }
});

export default checkin;
