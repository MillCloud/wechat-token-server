import { Controller, Get } from '@nestjs/common';
import { TokenService } from './token.service';

@Controller('token')
export class TokenController {
  constructor(private readonly tokenService: TokenService) {}

  @Get()
  async getAccessToken() {
    return {
      code: 200,
      accessToken: (await this.tokenService.get()).data.accessToken,
    };
  }

  @Get('check')
  async valid() {
    return {
      code: 200,
      accessToken: await this.tokenService.checkIfValid(
        (
          await this.tokenService.get()
        ).data.accessToken,
      ),
    };
  }
}
