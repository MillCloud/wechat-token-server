import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { TokenService } from './token.service';
import { TokenGuard } from './token.guard';

@Controller('token')
export class TokenController {
  constructor(private readonly tokenService: TokenService) {}

  @Get()
  @UseGuards(TokenGuard)
  async get(@Query('appId') appId: string) {
    const accessToken = await this.tokenService.get(appId);
    if (accessToken.success) {
      return {
        code: 0,
        message: 'OK',
        data: {
          accessToken: (await this.tokenService.get(appId)).data.accessToken,
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
  @UseGuards(TokenGuard)
  async check(@Query('appId') appId: string) {
    const accessToken = await this.tokenService.get(appId);
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
  @UseGuards(TokenGuard)
  async refresh(@Query('appId') appId: string) {
    await this.tokenService.refresh(appId);
    return {
      code: 0,
      message: 'OK',
      data: null,
    };
  }
}
