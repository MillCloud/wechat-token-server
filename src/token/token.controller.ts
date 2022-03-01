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
        code: 200,
        accessToken: (await this.tokenService.get()).data.accessToken,
      };
    }
    return {
      code: 100,
      message: accessToken.message,
    };
  }

  @Get('check')
  async valid() {
    return {
      code: 200,
      valid: await this.tokenService.checkIfValid(
        (
          await this.tokenService.get()
        ).data.accessToken,
      ),
    };
  }

  @Post('refresh')
  async refresh() {
    await this.tokenService.refresh();
    return {
      code: 200,
      accessToken: (await this.tokenService.get()).data.accessToken,
    };
  }
}
