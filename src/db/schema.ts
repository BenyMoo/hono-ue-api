import { mysqlTable, bigint, varchar, int, timestamp, boolean, date } from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';

export const users = mysqlTable('users', {
  id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  phone: varchar('phone', { length: 20 }),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  nickname: varchar('nickname', { length: 100 }),
  avatar: varchar('avatar', { length: 255 }),
  points: int('points').default(0).notNull(),
  isMember: boolean('is_member').default(false).notNull(),
  memberExpireAt: timestamp('member_expire_at'),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`).onUpdateNow().notNull(),
});

export const checkins = mysqlTable('checkins', {
  id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
  userId: bigint('user_id', { mode: 'number' }).notNull(), // Foreign key to users.id
  checkinDate: date('checkin_date').notNull(), // YYYY-MM-DD
  pointsEarned: int('points_earned').notNull(),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});
