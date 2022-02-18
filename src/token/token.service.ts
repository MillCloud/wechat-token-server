import { firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TokenService {
  private accessToken: AccessTokenType;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  getAccessToken() {
    return this.accessToken;
  }

  setAccessToken(accessToken: string, expiresIn: number) {
    this.accessToken = {
      content: accessToken,
      expiredAt: new Date(new Date().getTime() + expiresIn * 1000),
    };
  }

  async get() {
    const accessToken = this.getAccessToken();
    if (accessToken && +accessToken.expiredAt < new Date().getTime()) {
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
    this.setAccessToken(
      generateResult.data.accessToken,
      generateResult.data.expiresIn,
    );
    return {
      success: true,
      data: {
        accessToken: generateResult.data.accessToken,
      },
      message: '',
    };
  }

  /**
   * Generate a new access token
   * @returns
   */
  async generate(): Promise<MethodResponse> {
    const appId = this.configService.get<string>('appId');
    const appSecret = this.configService.get<string>('appSecret');
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

  refresh() {}

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
