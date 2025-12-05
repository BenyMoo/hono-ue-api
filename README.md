# Hono TiDB Backend Project

这是一个基于 Hono 框架和 TiDB (MySQL) 数据库的后端项目。

## 功能特性

- **用户认证**: 邮箱注册、登录 (JWT)。
- **签到系统**: 每日签到获取积分。
- **会员系统**: 积分兑换会员，会员状态查询。
- **数据库**: 使用 Drizzle ORM 连接 TiDB Serverless。

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

请创建 `.dev.vars` 文件 (用于本地开发):

```env
DATABASE_URL="mysql://<user>:<password>@<host>:4000/test?ssl={\"rejectUnauthorized\":true}"
JWT_SECRET="your_jwt_secret"
```

### 3. 数据库迁移

```bash
# 生成迁移文件
npm run generate

# 推送数据库结构 (需要配置好 DATABASE_URL)
# 或者手动执行下方的 SQL 语句
```

### 4. 启动开发服务器

```bash
npm run dev
```

## 数据库 SQL 语句

以下是项目所需的数据库表结构 SQL：

```sql
CREATE TABLE `checkins` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`user_id` bigint NOT NULL,
	`checkin_date` date NOT NULL,
	`points_earned` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `checkins_id` PRIMARY KEY(`id`)
);

CREATE TABLE `users` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`email` varchar(255) NOT NULL,
	`phone` varchar(20),
	`password_hash` varchar(255) NOT NULL,
	`nickname` varchar(100),
	`avatar` varchar(255),
	`points` int NOT NULL DEFAULT 0,
	`is_member` boolean NOT NULL DEFAULT false,
	`member_expire_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`)
);
```

## API 接口

- `POST /auth/register`: 注册
- `POST /auth/login`: 登录
- `POST /checkin`: 每日签到 (需 Auth)
- `POST /membership/redeem`: 积分兑换会员 (需 Auth)
- `GET /membership/status`: 查看会员状态 (需 Auth)

## API 文档

启动服务后，访问 `/ui` 查看交互式 API 文档 (Scalar UI)。
例如: `http://localhost:8787/ui`

