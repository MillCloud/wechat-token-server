import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';

@Injectable()
export class TokenGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

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

    const sign = request.query.sign;
    if (!sign) {
      return false;
    }

    const salt = this.configService.get<string>('signSalt');
    const hashCount = this.configService.get<number>('signHashCount');
    const realSign = this.generateSign(appId, timestamp, salt, hashCount);
    return sign === realSign;
  }

  private generateSign(
    appId: string,
    timestamp: string,
    salt: string,
    hashCount: number,
  ) {
    return this.multipleHash(appId + timestamp + salt, hashCount);
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
