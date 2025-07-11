import { Module } from '@nestjs/common';
import { KucoinService } from './kucoin.service';
import { KucoinController } from './kucoin.controller';

@Module({
  controllers: [KucoinController],
  providers: [KucoinService],
  exports: [KucoinService],
})
export class KucoinModule {}
