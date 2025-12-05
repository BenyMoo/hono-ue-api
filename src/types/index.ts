import { Database } from '../db';
import { Redis } from '@upstash/redis';

export type HonoEnv = {
    // 环境变量绑定 - 从 wrangler.jsonc 配置获取
    Bindings: {
        JWT_SECRET: string;        // JWT 密钥
        DATABASE_URL: string;      // 数据库连接 URL
        REDIS_URL: string;        // Redis 连接 URL
        REDIS_TOKEN: string;      // Redis 访问令牌
    };
    // 上下文变量 - 在请求处理过程中设置
    Variables: {
        db: Database;              // 数据库实例
        redis: Redis | null;        // Redis 实例（可选）
        user: {                     // 当前用户信息
            sub: number;            // 用户 ID
            email: string;          // 用户邮箱
            exp: number;            // JWT 过期时间
        };
    };
};
