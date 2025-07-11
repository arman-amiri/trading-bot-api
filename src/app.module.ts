import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { KucoinModule } from './modules/kucoin/kucoin.module';
import { IchimokuModule } from './modules/ichimoku/ichimoku.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: `.env.${process.env.ENV}`,
      isGlobal: true,
    }),
    KucoinModule,
    IchimokuModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
