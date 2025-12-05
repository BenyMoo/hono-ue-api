# 签到会员系统使用说明

## 项目概述

这是一个基于Hono框架的签到会员系统，支持用户签到、会员兑换、积分管理和统计功能。系统使用Redis缓存提高性能，支持完整的REST API接口。

## 主要功能

### 1. 签到功能
- ✅ 每日签到获取积分
- ✅ 防止重复签到
- ✅ 签到历史记录
- ✅ 今日签到状态查询
- ✅ Redis缓存优化

### 2. 会员功能
- ✅ 使用积分兑换会员
- ✅ 会员状态查询
- ✅ 会员兑换历史
- ✅ 会员有效期管理
- ✅ Redis缓存优化

### 3. 统计功能
- ✅ 用户个人统计
- ✅ 积分排行榜
- ✅ 系统总体统计
- ✅ Redis缓存优化

### 4. 认证功能
- ✅ JWT令牌认证
- ✅ 用户注册登录
- ✅ 用户信息管理

## API接口列表

### 认证接口
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/profile` - 获取用户信息

### 签到接口
- `POST /api/checkin/` - 执行签到
- `GET /api/checkin/status` - 获取今日签到状态
- `GET /api/checkin/history` - 获取签到历史

### 会员接口
- `POST /api/membership/redeem` - 兑换会员
- `GET /api/membership/status` - 获取会员状态
- `GET /api/membership/redeem-history` - 获取会员兑换历史

### 统计接口
- `GET /api/stats/user` - 获取用户统计
- `GET /api/stats/leaderboard` - 获取积分排行榜
- `GET /api/stats/system` - 获取系统统计

### 文档接口
- `GET /doc` - OpenAPI文档（JSON格式）
- `GET /ui` - Swagger UI界面

## 数据库结构

### 用户表 (users)
```sql
CREATE TABLE `users` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `password_hash` varchar(255) NOT NULL,
  `nickname` varchar(100) DEFAULT NULL,
  `avatar` varchar(255) DEFAULT NULL,
  `points` int NOT NULL DEFAULT 0,
  `is_member` tinyint(1) NOT NULL DEFAULT 0,
  `member_expire_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
);
```

### 签到记录表 (checkins)
```sql
CREATE TABLE `checkins` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `checkin_date` date NOT NULL,
  `points_earned` int NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_date` (`user_id`,`checkin_date`)
);
```

## Redis缓存策略

### 缓存键前缀
- `user:` - 用户缓存
- `checkin:` - 签到缓存
- `membership:` - 会员缓存
- `stats:` - 统计缓存
- `leaderboard:` - 排行榜缓存

### 缓存过期时间
- 用户缓存：1小时
- 签到缓存：24小时
- 会员缓存：30分钟
- 统计缓存：5分钟
- 排行榜缓存：1小时

## 配置说明

### 环境变量配置
```json
{
  "JWT_SECRET": "your-jwt-secret-key",
  "DATABASE_URL": "mysql://username:password@host:port/database",
  "REDIS_URL": "your-redis-url",
  "REDIS_TOKEN": "your-redis-token"
}
```

### 系统配置
- 每日签到积分：10分
- 会员兑换积分：100分
- 会员有效期：7天

## 快速开始

### 1. 安装依赖
```bash
npm install
```

### 2. 配置环境变量
编辑 `wrangler.jsonc` 文件，添加数据库和Redis配置

### 3. 运行开发服务器
```bash
npm run dev
```

### 4. 测试API
使用提供的测试脚本：
```bash
bash test-api.sh
```

## 使用示例

### 用户注册
```bash
curl -X POST http://127.0.0.1:8787/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "nickname": "测试用户"
  }'
```

### 用户登录
```bash
curl -X POST http://127.0.0.1:8787/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### 执行签到
```bash
curl -X POST http://127.0.0.1:8787/api/checkin/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 兑换会员
```bash
curl -X POST http://127.0.0.1:8787/api/membership/redeem \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 获取用户统计
```bash
curl -X GET http://127.0.0.1:8787/api/stats/user \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 获取积分排行榜
```bash
curl -X GET "http://127.0.0.1:8787/api/stats/leaderboard?limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 性能优化

### Redis缓存优化
- 签到状态缓存减少数据库查询
- 用户统计信息缓存提高响应速度
- 排行榜缓存减少复杂查询
- 智能缓存失效策略

### 数据库优化
- 合理的索引设计
- 唯一约束防止重复签到
- 事务保证数据一致性

## 错误处理

系统提供详细的错误信息：
- 400：请求参数错误
- 401：认证失败
- 404：资源不存在
- 500：服务器内部错误

## 安全特性

- JWT令牌认证
- 密码哈希存储
- 输入验证
- SQL注入防护
- 错误信息脱敏

## 扩展功能

### 计划支持的功能
- 连续签到奖励
- 会员等级系统
- 积分商城
- 社交功能
- 管理员后台

## 技术支持

如有问题，请查看API文档：
- Swagger UI: http://127.0.0.1:8787/ui
- OpenAPI文档: http://127.0.0.1:8787/doc