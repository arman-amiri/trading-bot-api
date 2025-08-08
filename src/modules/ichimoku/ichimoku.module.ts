import { Module } from '@nestjs/common';
import { IchimokuController } from './ichimoku.controller';
import { IchimokuService } from './ichimoku.service';
import { KucoinModule } from '../kucoin/kucoin.module';
import { MongooseModule } from '@nestjs/mongoose';
import { CandleSchema } from '../history/schema/history.schema';
import { AbcdAtop21Service } from './services/abcd-atop-21.service';

@Module({
  imports: [
    KucoinModule,
    MongooseModule.forFeature([{ name: 'Candle', schema: CandleSchema }]),
  ],
  controllers: [IchimokuController],
  providers: [IchimokuService, AbcdAtop21Service],
})
export class IchimokuModule {}
