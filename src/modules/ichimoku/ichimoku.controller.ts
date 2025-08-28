import { Controller, Get } from '@nestjs/common';
import { IchimokuService } from './ichimoku.service';

@Controller('ichimoku')
export class IchimokuController {
  constructor(private readonly ichimokuService: IchimokuService) {}

  @Get('new-abcd')
  async newAbcd() {
    return this.ichimokuService.newAbcd();
  }

  @Get('find-e')
  async findE() {
    return this.ichimokuService.newAbcd();
  }
}
