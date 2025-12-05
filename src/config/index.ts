export interface Config {
  database: {
    url: string;
  };
  redis: {
    url: string;
    token: string;
  };
  jwt: {
    secret: string;
  };
}

export const getConfig = (c: any): Config => {
  // 直接使用 wrangler.jsonc 中的变量从 Hono 上下文获取
  // 这在开发环境和生产环境中都能工作
  console.log('可用的环境变量:', Object.keys(c.env || {}));
  
  if (!c.env) {
    throw new Error('上下文中环境变量不可用');
  }
  
  return {
    database: {
      url: c.env.DATABASE_URL
    },
    redis: {
      url: c.env.REDIS_URL,
      token: c.env.REDIS_TOKEN
    },
    jwt: {
      secret: c.env.JWT_SECRET
    }
  };
};