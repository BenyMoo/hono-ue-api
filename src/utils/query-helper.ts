import { Redis } from '@upstash/redis/cloudflare';

export interface CacheOptions {
    redis: Redis | null;
    key: string;
    ttl: number; // seconds
}

/**
 * Executes a query with Redis caching and SQL logging.
 * 
 * @param options Cache options (redis instance, key, ttl)
 * @param queryBuilder Drizzle query builder or promise
 * @param fallback Optional fallback function if queryBuilder is not a standard Drizzle builder
 */
export async function cachedQuery<T>(
    options: CacheOptions,
    queryBuilder: any,
    fallback?: () => Promise<T>
): Promise<T> {
    const { redis, key, ttl } = options;

    // 1. Try Cache
    if (redis) {
        try {
            const cached = await redis.get(key);
            if (cached !== null && cached !== undefined) {
                console.log(`✓ [CACHE HIT] 数据来源: Redis缓存 | Key: ${key}`);

                // Try to parse if it's a string and looks like JSON
                if (typeof cached === 'string') {
                    try {
                        // Check if it looks like an object or array
                        if (cached.startsWith('{') || cached.startsWith('[')) {
                            return JSON.parse(cached);
                        }
                        // Handle boolean strings 'true'/'false' if any
                        if (cached === 'true') return true as unknown as T;
                        if (cached === 'false') return false as unknown as T;

                        return cached as unknown as T;
                    } catch {
                        return cached as unknown as T;
                    }
                } else {
                    // If upstash already parsed it (it handles JSON automatically sometimes)
                    return cached as T;
                }
            }
        } catch (err) {
            console.warn(`⚠ [CACHE ERROR] 读取缓存失败 | Key: ${key}`, err);
        }
    }

    // 2. Cache Miss - Execute Query
    console.log(`✗ [CACHE MISS] 数据来源: 数据库查询 | Key: ${key}`);

    // Log SQL
    try {
        if (queryBuilder && typeof queryBuilder.toSQL === 'function') {
            const sql = queryBuilder.toSQL();
            console.log(`📊 [SQL QUERY] ${sql.sql}`);
            console.log(`📌 [SQL PARAMS] ${JSON.stringify(sql.params)}`);
        }
    } catch (e) {
        console.warn('⚠ [SQL] 无法生成SQL日志', e);
    }

    let result: T;
    try {
        if (fallback) {
            result = await fallback();
        } else {
            result = await queryBuilder;
        }
    } catch (error) {
        console.error(`[DB] Query failed for key=${key}`, error);
        throw error;
    }

    // 3. Set Cache
    if (redis && result !== undefined && result !== null) {
        try {
            // Upstash Redis client handles object serialization if we pass an object to set/setex?
            // But to be safe and consistent with manual JSON.parse above, let's stringify if it's an object.
            // However, if we use `setex`, the signature might expect Value.
            // Let's check how redis-cache.ts does it. It uses JSON.stringify.

            const valueToStore = typeof result === 'object' ? JSON.stringify(result) : String(result);

            // Use setex if available, or set with ex
            if (typeof redis.setex === 'function') {
                await redis.setex(key, ttl, valueToStore);
            } else {
                await redis.set(key, valueToStore, { ex: ttl });
            }
        } catch (err) {
            console.warn(`[Cache] Error setting key=${key}`, err);
        }
    }

    return result;
}
