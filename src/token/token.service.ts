import { firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Interval } from '@nestjs/schedule';
import { InjectRedis, Redis } from '@nestjs-modules/ioredis';

@Injectable()
export class TokenService {
  private appId: string;
  private appSecret: string;
  private accessTokenKey = 'access_token';

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    @InjectRedis() private readonly redis: Redis,
  ) {
    this.appId = this.configService.get<string>('appId');
    this.appSecret = this.configService.get<string>('appSecret');
  }

  private async getAccessToken() {
    return await this.redis.get(this.accessTokenKey);
  }

  private async setAccessToken(accessToken: string, expiresIn: number) {
    await this.redis.set(
      this.accessTokenKey,
      accessToken,
      'EX',
      expiresIn - 60,
    );
  }

  private async deleteAccessToken() {
    await this.redis.del(this.accessTokenKey);
  }

  private async hasValidAccessToken() {
    return await this.redis.exists(this.accessTokenKey);
  }

  async get() {
    if (await this.hasValidAccessToken()) {
      return {
        success: true,
        data: {
          accessToken: await this.getAccessToken(),
        },
        message: '',
      };
    }

    const generateResult = await this.generate();
    if (!generateResult.success) {
      return generateResult;
    }

    const accessToken = generateResult.data.accessToken;
    await this.setAccessToken(accessToken, generateResult.data.expiresIn);
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
  async generate(): Promise<MethodResult> {
    const appId = this.appId;
    const appSecret = this.appSecret;
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

  async refresh() {
    await this.deleteAccessToken();
    await this.get();
  }

  @Interval('token-check-interval', 5000)
  async checkAndRefresh() {
    console.log(new Date().toISOString() + ': Checking access_token');
    const accessToken = await this.get();
    if (!(await this.checkIfValid(accessToken.data.accessToken))) {
      await this.deleteAccessToken();
      await this.get();
      console.log(new Date().toISOString() + ': Token invalid, refreshed');
    }
  }

  async checkIfValid(accessToken: string) {
    const url =
      'https://api.weixin.qq.com/cgi-bin/getcallbackip?access_token=' +
      accessToken;
    const response = await firstValueFrom(
      this.httpService.get<GetCallbackIpResponse>(url),
    );
    return response?.data?.ip_list?.length > 0;
  }
}

export type GetAccessTokenResponse = {
  access_token: string;
  expires_in: number;
  errcode?: number;
  errmsg?: string;
};

export type GetCallbackIpResponse = {
  ip_list: string[];
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
