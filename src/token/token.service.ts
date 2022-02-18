import { firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Interval } from '@nestjs/schedule';

@Injectable()
export class TokenService {
  private appId: string;
  private appSecret: string;
  private accessToken: AccessTokenType;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.appId = this.configService.get<string>('appId');
    this.appSecret = this.configService.get<string>('appSecret');
  }

  private getAccessToken() {
    return this.accessToken;
  }

  private setAccessToken(accessToken: string, expiresIn: number) {
    this.accessToken = {
      content: accessToken,
      expiredAt: new Date(new Date().getTime() + expiresIn * 1000),
    };
  }

  private deleteAccessToken() {
    this.accessToken = null;
  }

  private hasValidAccessToken() {
    const accessToken = this.getAccessToken();
    return accessToken && +accessToken.expiredAt < new Date().getTime();
  }

  async get() {
    if (this.hasValidAccessToken()) {
      return {
        success: true,
        data: {
          accessToken: this.getAccessToken().content,
        },
        message: '',
      };
    }

    const generateResult = await this.generate();
    if (!generateResult.success) {
      return generateResult;
    }

    const accessToken = generateResult.data.accessToken;
    this.setAccessToken(accessToken, generateResult.data.expiresIn);
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
  async generate(): Promise<MethodResponse> {
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
          response?.data?.errcode.toString() ??
          '' + ' ' + response?.data?.errmsg ??
          '',
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
    this.deleteAccessToken();
    await this.get();
  }

  @Interval('token-check-interval', 3000)
  async checkAndRefresh() {
    console.log(new Date().toISOString() + ': Checked and refreshed token');
    const accessToken = await this.get();
    if (!(await this.checkIfValid(accessToken.data.accessToken))) {
      this.deleteAccessToken();
      await this.get();
      console.log(new Date().toISOString() + ': Token expired, refreshed');
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

export type MethodResponse = {
  success: boolean;
  data: {
    accessToken: string;
    expiresIn: number;
  };
  message: string;
};

export type AccessTokenType = {
  content: string;
  expiredAt: Date;
};
