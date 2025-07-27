import { Get, Body, Controller, Query } from '@nestjs/common';
import { KucoinService } from './kucoin.service';

@Controller('kucoin')
export class KucoinController {
  constructor(private readonly kucoinService: KucoinService) {}

  @Get('candles')
  async getCandles(
    @Query('symbol') symbol: string = 'BTC-USDT',
    @Query('interval') interval: string = '15min',
    @Query('limit') limit: string = '2000',
  ) {
    return await this.kucoinService.getCandles(
      symbol,
      interval,
      parseInt(limit),
    );
  }
}
