import { Controller, Body, Query, Get } from '@nestjs/common';
import { IchimokuService } from './ichimoku.service';

@Controller('ichimoku')
export class IchimokuController {
  constructor(private readonly ichimokuService: IchimokuService) {}

  @Get('')
  async detectPatterns(@Query('fractalDepth') fractalDepth: string = '0') {
    return await this.ichimokuService.detectIchimokuPatterns({
      fractalDepth: parseInt(fractalDepth, 10) || 0,
    });
  }
}
