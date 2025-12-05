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



# 源代码目录结构

这个目录包含了应用程序的所有源代码，按功能模块组织：

## 目录结构

### `/config/` - 配置管理
- `index.ts` - 应用程序配置管理，从环境变量获取配置信息

### `/db/` - 数据库相关
- `index.ts` - 数据库连接和初始化
- `schema.ts` - 数据库表结构定义

### `/middlewares/` - 中间件
- `auth.ts` - 身份验证中间件

### `/routes/` - API 路由
- `index.ts` - 路由汇总和导出
- `auth.ts` - 认证相关路由（注册、登录）
- `checkin.ts` - 签到功能路由
- `membership.ts` - 会员功能路由

### `/types/` - 类型定义
- `index.ts` - 应用程序使用的 TypeScript 类型定义

### `/utils/` - 工具函数
- `redis.ts` - Redis 连接和操作工具
- `password.ts` - 密码加密和验证工具

### 根目录文件
- `index.ts` - 应用程序主入口文件，设置中间件和路由
- `openapi.ts` - OpenAPI/Swagger 文档配置



# 多平台部署指南

Hono 是一个跨平台的 Web 框架，除了 Cloudflare Workers，还可以轻松部署到 Node.js、Docker、Vercel 等平台。

由于本项目使用了 `@tidbcloud/serverless` 连接数据库（基于 HTTP），因此数据库连接在所有支持 fetch 的环境中都能直接工作，无需修改数据库代码。

## 1. 部署到 Node.js 服务器

如果你想在传统的 Linux 服务器 (如阿里云 ECS, AWS EC2) 或本地 Node.js 环境中运行。

### 安装依赖

需要安装 Node.js 适配器：

```bash
npm install @hono/node-server
```

### 创建入口文件

创建一个新的入口文件 `src/index.node.ts`:

```typescript
import { serve } from '@hono/node-server';
import app from './index';

const port = 3000;
console.log(`Server is running on port ${port}`);

serve({
  fetch: app.fetch,
  port
});
```

### 启动

使用 `tsx` 直接运行 (开发模式):

```bash
npx tsx src/index.node.ts
```

或者编译后运行 (生产模式):

1. 修改 `package.json` 添加构建脚本 (使用 tsc 或 esbuild)。
2. 运行编译后的 JS 文件。

---

## 2. 使用 Docker 部署

Docker 部署本质上是封装了 Node.js 环境。

### 创建 Dockerfile

在项目根目录创建 `Dockerfile`:

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# 这里假设你已经创建了 src/index.node.ts
# 并且安装了 tsx 用于直接运行 (或者你可以先编译)
RUN npm install -g tsx

EXPOSE 3000

CMD ["npx", "tsx", "src/index.node.ts"]
```

### 构建与运行

```bash
# 构建镜像
docker build -t hono-app .

# 运行容器 (记得传入环境变量)
docker run -p 3000:3000 \
  -e DATABASE_URL="mysql://..." \
  -e JWT_SECRET="your_secret" \
  hono-app
```

---

## 3. 部署到 Vercel

### 安装依赖

```bash
npm install @hono/vercel
```

### 创建 `api/index.ts`

在根目录创建 `api` 文件夹和 `index.ts`:

```typescript
import { handle } from '@hono/vercel/edge'; // 或者 'standard' 使用 Node.js runtime
import app from '../src/index';

export const config = {
  runtime: 'edge', // 如果使用 node runtime 则改为 'nodejs'
};

export default handle(app);
```

Vercel 会自动识别并部署。




