import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TokenController } from './token/token.controller';
import { TokenService } from './token/token.service';
import loadConfig from './config/configurations';

@Module({
  imports: [
    HttpModule,
    ConfigModule.forRoot({
      load: [loadConfig],
      envFilePath: '.env',
    }),
  ],
  controllers: [AppController, TokenController],
  providers: [AppService, TokenService, ConfigModule],
})
export class AppModule {}
