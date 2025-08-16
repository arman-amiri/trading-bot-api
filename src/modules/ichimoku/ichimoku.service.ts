import { Injectable } from '@nestjs/common';
import { KucoinService } from '../kucoin/kucoin.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AbcdAtop21Service } from './services/abcd-atop-21.service';
import ICandel from './interfaces/candel.interface';

// type Candle = {
//   open: number;
//   close: number;
//   high: number;
//   low: number;
//   volume?: number;
//   timestamp?: number;
//   openTime?: number;
//   sourceIndex?: number;
//   dateShamsi?: string;
//   index: number;
//   trend?: 'bullish' | 'bearish' | 'neutral';
// };

@Injectable()
export class IchimokuService {
  constructor(
    private kucoinService: KucoinService,
    private abcdAtop21Service: AbcdAtop21Service,
    @InjectModel('Candle') private candleModel: Model<ICandel>,
  ) {}

  async newAbcd(symbol = 'BTC-USDT', interval = '15min') {
    // گرفتن همه کندل‌ها از دیتابیس
    const candles = await this.candleModel
      .find({ symbol, interval })
      .sort({ openTime: 1 }) // از جدید به قدیم
      // .limit(10)
      .lean();
    const result = this.abcdAtop21Service.detectABCD(candles, 300, 78, 1);
    return result;
  }
}

// [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
// "finalResult": [
//     [
//         6,
//         7,
//         8,
//         9,
//         10
//     ],
//     [
//         5,
//         6,
//         7,
//         8,
//         9
//     ],
//     [
//         4,
//         5,
//         6,
//         7,
//         8
//     ],]
