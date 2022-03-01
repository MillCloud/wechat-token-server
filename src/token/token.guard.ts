import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';

@Injectable()
export class TokenGuard implements CanActivate {
  private salt: string;
  private hashCount: number;
  constructor(private readonly configService: ConfigService) {
    this.salt = this.configService.get<string>('TOKEN_SALT');
    this.hashCount = this.configService.get<number>('TOKEN_HASH_COUNT');
  }

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const appId = request.query.appId;
    if (!appId) {
      return false;
    }
    const timestamp = request.query.timestamp;
    if (!timestamp) {
      return false;
    }
    if (Math.abs(Date.now() - timestamp) > 60 * 1000) {
      return false;
    }
    const token = request.headers.authorization;
    if (!token) {
      return false;
    }

    const realToken = this.multipleHash(appId + this.salt, this.hashCount);
    console.log(realToken);
    return token !== realToken;
  }

  private multipleHash(text: string, count: number) {
    if (count < 1) {
      return text;
    }
    return this.multipleHash(this.md5(text), count - 1);
  }

  private md5(text: string) {
    return createHash('md5').update(text).digest('hex');
  }
}
