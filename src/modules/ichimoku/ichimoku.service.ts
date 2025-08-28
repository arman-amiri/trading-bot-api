import { Injectable } from '@nestjs/common';
import { KucoinService } from '../kucoin/kucoin.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AbcdAtop21Service } from './services/abcd-atop-21.service';
import ICandel from './interfaces/candel.interface';
import { IAbcd } from '../history/schema/abcd.schema';

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
    @InjectModel('Abcd') private abcdModel: Model<IAbcd>,
  ) {}

  async newAbcd(symbol = 'BTC-USDT', interval = '15min') {
    // گرفتن همه کندل‌ها از دیتابیس
    const candles = await this.candleModel
      .find({ symbol, interval })
      .sort({ openTime: 1 }) // از جدید به قدیم
      // .limit(10)
      .lean();
    const result = this.abcdAtop21Service.detectABCD(candles, 300, 78, 1);

    await this.saveAbcdPatterns(symbol, interval, result);
    return result;
  }

  private async saveAbcdPatterns(
    symbol: string,
    interval: string,
    result: any,
  ) {
    try {
      // حذف رکوردهای قدیمی برای این symbol و interval
      await this.abcdModel.deleteMany({ symbol, interval });

      // ایجاد رکورد جدید
      const abcdRecord = new this.abcdModel({
        symbol,
        interval,
        founded: result.founded,
        uniqueResultsfounded: result.uniqueResultsfounded,
        patterns: result.uniqueResults.map((pattern) => ({
          A: pattern.A,
          B: pattern.B,
          C: pattern.C,
          D: pattern.D,
          countBetweenAandB: pattern.countBetweenAandB,
          countBetweenBandD: pattern.countBetweenBandD,
        })),
      });

      await abcdRecord.save();
      console.log(`ABCD patterns saved for ${symbol}-${interval}`);
    } catch (error) {
      console.error('Error saving ABCD patterns:', error);
      throw error;
    }
  }

  async findE(symbol = 'BTC-USDT', interval = '15min') {
    // گرفتن همه کندل‌ها از دیتابیس
    const candles = await this.candleModel
      .find({ symbol, interval })
      .sort({ openTime: 1 }) // از جدید به قدیم
      // .limit(10)
      .lean();

    // گرفتن همه نقاط از دیتابیس
    const abcd = await this.abcdModel
      .find({ symbol, interval })
      .sort({ openTime: 1 }) // از جدید به قدیم
      // .limit(10)
      .lean();
    return abcd;
    const result = this.abcdAtop21Service.findE(candles, abcd);

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
