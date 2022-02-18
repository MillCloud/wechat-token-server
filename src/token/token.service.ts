import { Injectable } from '@nestjs/common';

@Injectable()
export class TokenService {
  get() {
    return 'accessToken';
  }

  refresh() { }

  checkIfValid() { }
}
