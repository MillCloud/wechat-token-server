# wechat-token-service

## 简介

微信 access_token 中控服务

[官方文档：access_token 相关说明](https://developers.weixin.qq.com/miniprogram/dev/api-backend/open-api/access-token/auth.getAccessToken.html)

## 安装

```bash
# clone 项目到本地
$ git clone git@github.com:MillCloud/wechat-token-server.git
# 进入项目
$ cd wechat-token-server
# 安装依赖
$ npm install
# 复制 .example.env 并重命名为 .env，并修改参数
$ cp .example.env .env
```

## 运行

> 默认运行在 3000 端口

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run build
$ npm run start:prod
```

## 部署

### Docker

> 要求服务器已安装 Docker；`REDIS_HOST` 需填写容器内可访问的 Redis 地址（Redis 在宿主机时不能用 127.0.0.1）

镜像版本使用北京时间的年月日时分加 Git 短提交号，例如 `wechat-token-server:202610261530-0123456`。构建前先提交所有改动，`git status --short` 应无输出，保证镜像内容对应提交号。版本在构建前生成一次，部署和回滚沿用发布包中的版本，不按服务器时间重新生成。

```bash
# .env 放在 docker-compose.yml 同级目录（参考 .example.env），通过只读挂载注入容器，不打入镜像
$ export image_version="$(TZ=Asia/Shanghai date +%Y%m%d%H%M)-$(git rev-parse --short=7 HEAD)"
$ docker-compose up -d --build
```

`image_version` 必填，通过终端环境变量传入，不需要修改应用的 `.env`。后续 Compose 命令在同一终端执行；新开终端时先重新设置当前部署的版本。

容器通过 `TZ=Asia/Shanghai` 使用北京时间，镜像安装 `tzdata`。token 检查和刷新日志固定使用北京时间，并带 `+08:00` 标记。

修改时区配置后，本地部署执行 `docker-compose up -d --build`；传镜像部署需重新构建、导出和导入镜像，并同步更新服务器上的 `docker-compose.yml`。

启动后验证时区：`date` 应显示 `+0800`，Node 输出的时区应为 `Asia/Shanghai`。

```bash
$ docker-compose exec wechat-token-server date '+%Y-%m-%d %H:%M:%S %z'
$ docker-compose exec wechat-token-server node -p 'Intl.DateTimeFormat().resolvedOptions().timeZone'
```

更新代码并提交后，重新生成 `image_version`，再执行 `docker-compose up -d --build`；保留旧版本镜像用于回滚。

打包镜像传到服务器（镜像 tag、导出包文件名和服务器上的 `image_version` 使用同一版本）：

在本机项目目录构建镜像，导出包放项目父目录，避免进入下次构建的上下文：

```bash
$ export image_version="$(TZ=Asia/Shanghai date +%Y%m%d%H%M)-$(git rev-parse --short=7 HEAD)"
$ docker-compose build
$ docker save "wechat-token-server:$image_version" | gzip > "../wechat-token-server-$image_version.tar.gz"
```

仍在本机上传镜像包，首次部署先创建服务器目录：

```bash
$ ssh user@your-server 'mkdir -p /opt/wechat-token-server'
$ scp "../wechat-token-server-$image_version.tar.gz" user@your-server:/opt/wechat-token-server/
```

登录服务器，放好 `docker-compose.yml` 和 `.env` 后导入启动。`image_version` 必须与镜像包文件名中的版本一致，下面的版本仅为示例：

```bash
$ cd /opt/wechat-token-server
$ export image_version=202610261530-0123456
$ docker load < "wechat-token-server-$image_version.tar.gz"
$ docker-compose up -d --no-build
```

> 服务器上先确认 `.env` 已放好再启动，否则挂载点会被自动创建成目录导致启动失败；使用 `--no-build` 直接启动已导入的镜像。

每次发布同步服务器上的 `docker-compose.yml`，保留旧版本镜像和导出包。回滚时将 `image_version` 设置为旧版本，再执行 `docker-compose up -d --no-build`。

### pm2（旧部署方式）

[pm2](https://pm2.keymetrics.io/)

```bash
# use pm2 to deploy
$ npm run build
$ pm2 start npm --name wechat-token-server -- run start:prod
```

## 测试（未做）

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## 使用

### 接口验证参数（url）

- appId：应用 ID
- timestamp：时间戳（单位：毫秒）
- sign：签名，生成规则：appId + timestamp + 随机字符串，然后用 md5（小写，32 位）加密 n 次

### 获取 access_token

> 客户端本地无缓存 access_token 时，需要调用此接口获取

`GET /token`

query 参数：

- appId：应用 ID

返回值：

```json
{
  "code": "<number，0 表示成功>",
  "message": "<string>",
  "data": {
    "accessToken": "<string>",
    "expiresIn": "<number，有效时间，单位：秒，客户端保存的缓存过期时间应稍小于此字段（5～200）>"
  }
}
```

### 刷新 access_token

> 在 access_token 过期时，使用此接口刷新后重新获取
> 若在当前 access_token 有效期内进行刷新，则会生成新的，旧的 5 分钟内可用

`POST /token/refresh`

query 参数：

- appId：应用 ID

返回值：

```json
{
  "code": "<number，0 表示成功>",
  "message": "<string>",
  "data": null
}
```
