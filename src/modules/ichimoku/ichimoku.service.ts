// ichimoku.service.ts
import { Injectable } from '@nestjs/common';
import { KucoinService } from '../kucoin/kucoin.service';

type Candle = {
  open: number;
  close: number;
  high: number;
  low: number;
  volume?: number;
  timestamp?: number;
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
  constructor(private kucoinService: KucoinService) {}

  async detectAbcdeATop2_1(symbol = 'BTC-USDT', interval = '15min') {
    const candles = await this.kucoinService.getCandles(symbol, interval, 300);

    console.log(candles.length, 'ppppp');
    if (candles.length < 78) {
      throw new Error('Not enough candles');
    }

    const A = candles[0]; // اولین کندل (قدیمی‌ترین)
    const D = candles[candles.length - 1]; // آخرین کندل (جدیدترین)

    // پیدا کردن پایین‌ترین نقطه در بین همه کندل‌ها
    const B = candles.reduce(
      (min, c) => (c.low < min.low ? c : min),
      candles[0],
    );

    // بازه بین B و D (از نظر زمان)
    const start = Math.min(B.timestamp, D.timestamp);
    const end = Math.max(B.timestamp, D.timestamp);

    // پیدا کردن بالاترین نقطه C بین B و D
    const candlesBetweenBAndD = candles.filter(
      (c) => c.timestamp >= start && c.timestamp <= end,
    );

    const C = candlesBetweenBAndD.reduce(
      (max, c) => (c.high > max.high ? c : max),
      candlesBetweenBAndD[0],
    );

    return { A, B, C, D };
  }
}
