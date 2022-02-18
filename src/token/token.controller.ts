import { Controller, Get } from '@nestjs/common';
import { TokenService } from './token.service';

@Controller('token')
export class TokenController {
  constructor(private readonly tokenService: TokenService) { }

  @Get()
  getAccessToken() {
    return {
      code: 200,
      accessToken: this.tokenService.get(),
    };
  }
}
