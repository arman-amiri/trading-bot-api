import { Controller, Body, Query, Get } from '@nestjs/common';
import { IchimokuService } from './ichimoku.service';

@Controller('ichimoku')
export class IchimokuController {
  constructor(private readonly ichimokuService: IchimokuService) {}

  @Get('abcde-a-top-2-1')
  async getPattern78(
    @Query('symbol') symbol = 'BTC-USDT',
    @Query('interval') interval = '15min',
  ) {
    return this.ichimokuService.detectAbcdeATop2_1(symbol, interval);
  }
}
