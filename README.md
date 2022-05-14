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
