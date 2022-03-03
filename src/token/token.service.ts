import { firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Interval } from '@nestjs/schedule';
import { InjectRedis, Redis } from '@nestjs-modules/ioredis';

@Injectable()
export class TokenService {
  private apps: Apps;
  private appMap = new Map<string, string>();
  private tokenKeyPrefix: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    @InjectRedis() private readonly redis: Redis,
  ) {
    this.tokenKeyPrefix = this.configService.get('tokenKeyPrefix');
    this.apps = this.configService.get<Apps>('apps');
    this.apps.forEach((app) => {
      this.appMap.set(app.id, app.secret);
    });
  }

  private async getAccessToken(appId: string) {
    return await this.redis.get(this.getAccessTokenKey(appId));
  }

  private getAccessTokenKey(appId: string) {
    return this.tokenKeyPrefix + appId;
  }

  private async setAccessToken(
    appId: string,
    accessToken: string,
    expiresIn: number,
  ) {
    await this.redis.set(
      this.getAccessTokenKey(appId),
      accessToken,
      'EX',
      expiresIn - 60,
    );
  }

  private async deleteAccessToken(appId: string) {
    await this.redis.del(this.getAccessTokenKey(appId));
  }

  private async hasValidAccessToken(appId: string) {
    return await this.redis.exists(this.getAccessTokenKey(appId));
  }

  async get(appId: string) {
    if (await this.hasValidAccessToken(appId)) {
      return {
        success: true,
        data: {
          accessToken: await this.getAccessToken(appId),
        },
        message: '',
      };
    }

    const generateResult = await this.generate(appId);
    if (!generateResult.success) {
      return generateResult;
    }

    const accessToken = generateResult.data.accessToken;
    await this.setAccessToken(
      appId,
      accessToken,
      generateResult.data.expiresIn,
    );
    return {
      success: true,
      data: {
        accessToken,
      },
      message: '',
    };
  }

  /**
   * Generate a new access token
   * @returns
   */
  async generate(appId: string): Promise<MethodResult> {
    const appSecret = this.appMap.get(appId);
    const url =
      'https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=' +
      appId +
      '&secret=' +
      appSecret;

    const response = await firstValueFrom(
      this.httpService.get<GetAccessTokenResponse>(url),
    );
    const accessToken = response?.data?.access_token ?? '';
    if (accessToken === '') {
      return {
        success: false,
        data: {
          accessToken: '',
          expiresIn: 0,
        },
        message:
          (response?.data?.errcode.toString() ?? '') +
          ': ' +
          (response?.data?.errmsg ?? ''),
      };
    }

    return {
      success: true,
      data: {
        accessToken,
        expiresIn: response.data.expires_in,
      },
      message: '',
    };
  }

  async refresh(appId: string) {
    const generateResult = await this.generate(appId);
    if (!generateResult.success) {
      return generateResult;
    }

    const accessToken = generateResult.data.accessToken;
    await this.setAccessToken(
      appId,
      accessToken,
      generateResult.data.expiresIn,
    );
  }

  @Interval('token-check-interval', 3000)
  async checkAndRefresh() {
    const isAutoRefresh = this.configService.get('tokenIsAutoRefresh');
    if (!isAutoRefresh) {
      return;
    }

    console.log(new Date().toISOString() + ': Checking access_token');

    for (let i = 0; i < this.apps.length; i++) {
      const app = this.apps[i];
      const appId = app.id;
      const accessToken = await this.get(appId);
      if (!(await this.checkIfValid(accessToken.data.accessToken))) {
        await this.refresh(appId);
        console.log(
          new Date().toISOString() +
          ': Token invalid, refreshed, appId: ' +
          appId,
        );
      }
    }
  }

  async checkIfValid(accessToken: string) {
    const tokenCheckApi = this.configService.get('tokenCheckApi');
    const url = `https://api.weixin.qq.com${tokenCheckApi}?access_token=${accessToken}`;
    const response = await firstValueFrom(
      this.httpService.post<GetValidResponse>(url),
    );
    return response?.data?.errcode !== 40001;
  }
}

export type GetAccessTokenResponse = {
  access_token: string;
  expires_in: number;
  errcode?: number;
  errmsg?: string;
};

export type GetValidResponse = {
  errcode?: number;
  errmsg?: string;
};

export type MethodResult = {
  success: boolean;
  data: {
    accessToken: string;
    expiresIn: number;
  };
  message: string;
};

export type AccessToken = {
  content: string;
  expiredAt: Date;
};

export type Apps = {
  id: string;
  secret: string;
}[];
