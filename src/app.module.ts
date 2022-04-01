import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TokenController } from './token/token.controller';
import { TokenService } from './token/token.service';
import loadConfig from './config/configurations';
import { ScheduleModule } from '@nestjs/schedule';
import { RedisModule } from '@nestjs-modules/ioredis';

@Module({
  imports: [
    HttpModule,
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      load: [loadConfig],
      envFilePath: '.env',
    }),
    RedisModule.forRoot({
      config: {
        host: loadConfig().redis.host,
        port: loadConfig().redis.port,
        password: loadConfig().redis.password,
      },
    }),
  ],
  controllers: [AppController, TokenController],
  providers: [AppService, TokenService, ConfigModule],
})
export class AppModule {}
