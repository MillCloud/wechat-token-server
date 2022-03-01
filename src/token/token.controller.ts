import { Controller, Get, Post } from '@nestjs/common';
import { TokenService } from './token.service';

@Controller('token')
export class TokenController {
  constructor(private readonly tokenService: TokenService) {}

  @Get()
  async get() {
    const accessToken = await this.tokenService.get();
    if (accessToken.success) {
      return {
        code: 0,
        message: 'OK',
        data: {
          accessToken: (await this.tokenService.get()).data.accessToken,
        },
      };
    }
    return {
      code: 100,
      message: accessToken.message,
      data: null,
    };
  }

  @Get('check')
  async check() {
    const accessToken = await this.tokenService.get();
    const isValid = await this.tokenService.checkIfValid(
      accessToken.data.accessToken,
    );
    return {
      code: 0,
      message: 'OK',
      data: {
        isValid: isValid,
      },
    };
  }

  @Post('refresh')
  async refresh() {
    await this.tokenService.refresh();
    return {
      code: 0,
      message: 'OK',
      data: null,
    };
  }
}
