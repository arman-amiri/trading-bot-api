import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { KucoinModule } from './modules/kucoin/kucoin.module';
import { IchimokuModule } from './modules/ichimoku/ichimoku.module';
import { MongooseModule } from '@nestjs/mongoose';
import { HistoryModule } from './modules/history/history.module';
import mongoConfig from './config/mongo.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: `.env.${process.env.ENV}`,
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      ...mongoConfig(), // Use the MongoDB configuration
      inject: [ConfigService],
    }),
    KucoinModule,
    IchimokuModule,
    HistoryModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
