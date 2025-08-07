import { Controller, Body, Query, Get } from '@nestjs/common';
import { IchimokuService } from './ichimoku.service';

@Controller('ichimoku')
export class IchimokuController {
  constructor(private readonly ichimokuService: IchimokuService) {}

  @Get('abcde-a-top-2-1')
  async detectAbcdeATop2_1(
    @Query('symbol') symbol = 'BTC-USDT',
    @Query('interval') interval = '15min',
  ) {
    return this.ichimokuService.detectAbcdeATop2_1(symbol, interval);
  }

  @Get('old-abcde-a-top-2-1')
  async detectOldAbcdeATop2_1(
    @Query('symbol') symbol = 'BTC-USDT',
    @Query('interval') interval = '15min',
  ) {
    return this.ichimokuService.detectAbcdeATop2_1(symbol, interval);
  }
}
