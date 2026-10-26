# 构建阶段（服务器为 amd64，固定平台避免本机 arm 架构镜像无法在服务器运行）
FROM --platform=linux/amd64 node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps --no-audit --no-fund

COPY . .
RUN npm run build

# 运行阶段
FROM --platform=linux/amd64 node:22-alpine

WORKDIR /app

ENV NODE_ENV=production

RUN apk add --no-cache tzdata

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --legacy-peer-deps --no-audit --no-fund

COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/main"]
