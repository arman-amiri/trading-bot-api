// ichimoku.service.ts
import { Injectable } from '@nestjs/common';
import { KucoinService } from '../kucoin/kucoin.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AbcdAtop21Service } from './services/abcd-atop-21.service';

type Candle = {
  open: number;
  close: number;
  high: number;
  low: number;
  volume?: number;
  timestamp?: number;
  openTime?: number;
  sourceIndex?: number;
  dateShamsi?: string;
  index: number;
  trend?: 'bullish' | 'bearish' | 'neutral';
};

export interface DetectedPattern {
  type: 'V' | 'N';
  startIndex: number;
  endIndex: number;
  candles: Candle[];
  fractalLevel: number;
}

export interface DetectionOptions {
  fractalDepth?: number;
}

@Injectable()
export class IchimokuService {
  // AbcdAtop21Service
  constructor(
    private kucoinService: KucoinService,
    private abcdAtop21Service: AbcdAtop21Service,
    @InjectModel('Candle') private candleModel: Model<Candle>,
  ) {}

  async detectAbcdeATop2_1(symbol = 'BTC-USDT', interval = '15min') {
    const candles = await this.kucoinService.getCandles(symbol, interval, 300);

    candles.reverse();

    while (candles.length >= 78) {
      // نقطه A: بالاترین کندل در بازه فعلی
      const A = candles.reduce(
        (max, c) => (c.high > max.high ? c : max),
        candles[0],
      );

      // const A = candles[candles.length - 1];

      // نقطه B: پایین‌ترین کندل در بازه فعلی
      const B = candles.reduce(
        (min, c) => (c.low < min.low ? c : min),
        candles[0],
      );

      // نقطه D: آخرین کندل
      const D = candles[0];

      // نقطه C: بالاترین کندل بین B و D
      const start = Math.min(B.timestamp, D.timestamp);
      const end = Math.max(B.timestamp, D.timestamp);

      const candlesBetweenBAndD = candles.filter(
        (c) => c.timestamp >= start && c.timestamp <= end,
      );

      const C = candlesBetweenBAndD.reduce(
        (max, c) => (c.high > max.high ? c : max),
        candlesBetweenBAndD[0],
      );

      // ایندکس‌ها
      const indexA = candles.findIndex((c) => c.timestamp === A.timestamp);
      const indexB = candles.findIndex((c) => c.timestamp === B.timestamp);
      const indexD = candles.findIndex((c) => c.timestamp === D.timestamp);

      const countBetweenAandB = Math.abs(indexB - indexA) + 1;
      const countBetweenBandD = Math.abs(indexD - indexB) + 1;

      const tolerance = 2;
      const isValid =
        Math.abs(countBetweenAandB - 2 * countBetweenBandD) <= tolerance;

      if (isValid) {
        console.log(
          `Pattern found with ${candles.length} candles (A index: ${indexA}, B index: ${indexB}, D index: ${indexD})`,
        );
        return { A, B, C, D, countBetweenAandB, countBetweenBandD };
      }
      // حذف قدیمی‌ترین کندل (سمت راست)
      candles.pop();
    }

    return { message: 'Pattern not found' };
  }

  async detectOldAbcdeATop2_1(
    symbol = 'BTC-USDT',
    interval = '15min',
  ): Promise<any> {
    const candles = await this.kucoinService.getCandles(symbol, interval, 300);

    candles.reverse();

    while (candles.length >= 78) {
      // نقطه A: بالاترین کندل در بازه فعلی
      const A = candles.reduce(
        (max, c) => (c.high > max.high ? c : max),
        candles[0],
      );

      // const A = candles[candles.length - 1];

      // نقطه B: پایین‌ترین کندل در بازه فعلی
      const B = candles.reduce(
        (min, c) => (c.low < min.low ? c : min),
        candles[0],
      );

      // نقطه D: آخرین کندل
      const D = candles[0];

      // نقطه C: بالاترین کندل بین B و D
      const start = Math.min(B.timestamp, D.timestamp);
      const end = Math.max(B.timestamp, D.timestamp);

      const candlesBetweenBAndD = candles.filter(
        (c) => c.timestamp >= start && c.timestamp <= end,
      );

      const C = candlesBetweenBAndD.reduce(
        (max, c) => (c.high > max.high ? c : max),
        candlesBetweenBAndD[0],
      );

      // ایندکس‌ها
      const indexA = candles.findIndex((c) => c.timestamp === A.timestamp);
      const indexB = candles.findIndex((c) => c.timestamp === B.timestamp);
      const indexD = candles.findIndex((c) => c.timestamp === D.timestamp);

      const countBetweenAandB = Math.abs(indexB - indexA) + 1;
      const countBetweenBandD = Math.abs(indexD - indexB) + 1;

      const tolerance = 2;
      const isValid =
        Math.abs(countBetweenAandB - 2 * countBetweenBandD) <= tolerance;

      if (isValid) {
        console.log(
          `Pattern found with ${candles.length} candles (A index: ${indexA}, B index: ${indexB}, D index: ${indexD})`,
        );
        return { A, B, C, D, countBetweenAandB, countBetweenBandD };
      }
      // حذف قدیمی‌ترین کندل (سمت راست)
      candles.pop();
    }

    return { message: 'Pattern not found' };
  }

  async backtestAbcdeATop2_1(symbol = 'BTC-USDT', interval = '15min') {
    // گرفتن همه کندل‌ها از دیتابیس
    const candles = await this.candleModel
      .find({ symbol, interval })
      .sort({ openTime: -1 }) // از جدید به قدیم
      .lean();

    // معکوس کردن برای مرتب‌شدن از قدیم به جدید
    candles.reverse();

    const detectedPatterns: any = [];

    // الگوریتم اسلایدینگ روی کل دیتاست
    for (let i = 0; i <= candles.length - 78; i++) {
      const window = candles.slice(i, i + 78);

      const A = window.reduce(
        (max, c) => (c.high > max.high ? c : max),
        window[0],
      );
      const B = window.reduce(
        (min, c) => (c.low < min.low ? c : min),
        window[0],
      );
      const D = window[window.length - 1];

      const start = Math.min(B.openTime!, D.openTime!);
      const end = Math.max(B.openTime!, D.openTime!);

      const candlesBetweenBAndD = window.filter(
        (c) => c.openTime! >= start && c.openTime! <= end,
      );

      if (candlesBetweenBAndD.length === 0) continue;

      const C = candlesBetweenBAndD.reduce(
        (max, c) => (c.high > max.high ? c : max),
        candlesBetweenBAndD[0],
      );

      const indexA = window.findIndex((c) => c.openTime === A.openTime);
      const indexB = window.findIndex((c) => c.openTime === B.openTime);
      const indexD = window.findIndex((c) => c.openTime === D.openTime);

      const countAB = Math.abs(indexB - indexA) + 1;
      const countBD = Math.abs(indexD - indexB) + 1;

      const tolerance = 2;
      const isValid = Math.abs(countAB - 2 * countBD) <= tolerance;

      if (isValid) {
        detectedPatterns.push({
          index: i,
          A,
          B,
          C,
          D,
          countAB,
          countBD,
        });
      }
    }

    console.log(`✅ تعداد الگوهای شناسایی‌شده: ${detectedPatterns.length}`);
    return detectedPatterns.length;
  }

  async newAbcd(symbol = 'BTC-USDT', interval = '15min') {
    // گرفتن همه کندل‌ها از دیتابیس
    const candles = await this.candleModel
      .find({ symbol, interval })
      .sort({ openTime: 1 }) // از جدید به قدیم
      .lean();
    console.log(candles.length, 'pp');
    const result = this.abcdAtop21Service.detectABCD(candles, 300, 78, 2);
    return result;
  }
}
