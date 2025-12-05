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
