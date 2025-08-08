import { Controller, Get } from '@nestjs/common';
import { HistoryService } from './history.service';

@Controller('history')
export class HistoryController {
  constructor(private readonly historyService: HistoryService) {}

  @Get('fetch')
  fetchCandles() {
    return this.historyService.fetchAndSaveCandles();
  }

  @Get('fetch-large')
  fetchLarge() {
    return this.historyService.fetchLargeHistory('BTC-USDT', '15min', 50000);
  }
}
