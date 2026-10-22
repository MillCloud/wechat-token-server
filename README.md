# wechat-token-service

## 简介

微信 access_token 中控服务

[官方文档：access_token 相关说明](https://developers.weixin.qq.com/miniprogram/dev/api-backend/open-api/access-token/auth.getAccessToken.html)

## 安装

```bash
# clone 项目到本地
$ git@github.com:MillCloud/wechat-token-server.git
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

```bash
# .env 放在 docker-compose.yml 同级目录（参考 .example.env），通过只读挂载注入容器，不打入镜像
$ docker-compose up -d
```

更新代码时，需要删除旧容器和镜像重新运行上面这行命令。

打包镜像传到服务器（tag 与 docker-compose.yml 中的 `image` 字段保持一致，发新版时同步修改）：

```bash
# 本地：构建镜像并导出
$ version=0.0.1
$ docker-compose build
$ docker save wechat-token-server:$version | gzip > wechat-token-server-$version.tar.gz

# 本地：上传到服务器
$ scp wechat-token-server-$version.tar.gz user@your-server:/opt/wechat-token-server/

# 服务器：导入镜像，放好 docker-compose.yml 和 .env 后启动
$ cd /opt/wechat-token-server
$ docker load < wechat-token-server-$version.tar.gz
$ docker-compose up -d
```

> 服务器上先确认 `.env` 已放好再启动，否则挂载点会被自动创建成目录导致启动失败；服务器上不加 `--build`，`docker-compose up -d` 会直接使用已导入的镜像

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
