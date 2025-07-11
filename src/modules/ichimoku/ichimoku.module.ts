import { Module } from '@nestjs/common';
import { IchimokuController } from './ichimoku.controller';
import { IchimokuService } from './ichimoku.service';
import { KucoinModule } from '../kucoin/kucoin.module';

@Module({
  imports: [KucoinModule],
  controllers: [IchimokuController],
  providers: [IchimokuService],
})
export class IchimokuModule {}
