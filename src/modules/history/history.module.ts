import { Module } from '@nestjs/common';
import { HistoryService } from './history.service';
import { HistoryController } from './history.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { CandleSchema } from './schema/history.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Candle', schema: CandleSchema }]),
  ],
  controllers: [HistoryController],
  providers: [HistoryService],
})
export class HistoryModule {}
