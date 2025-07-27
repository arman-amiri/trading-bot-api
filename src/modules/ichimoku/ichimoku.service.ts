// ichimoku.service.ts
import { Injectable } from '@nestjs/common';
import { KucoinService } from '../kucoin/kucoin.service';
import {
  calculateZigZagAdvanced,
  ZigZagPoint,
} from 'src/indicators/zigzag.indicator';

type Candle = {
  open: number;
  close: number;
  high: number;
  low: number;
  volume?: number;
  timestamp?: number;
  sourceIndex?: number;
};

export interface CyclePattern {
  A: Candle;
  B: Candle;
  C: Candle;
  D: Candle;
  distanceAB: number;
  distanceBC: number;
  isValid: boolean;
}

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

  async detectIchimokuPatterns(
    options: DetectionOptions = { fractalDepth: 0 },
  ): Promise<DetectedPattern[]> {
    const candles = await this.kucoinService.getCandles('BTC-USDT');
    console.log(candles[0]);
    const patterns: DetectedPattern[] = [];
    const depth = options.fractalDepth || 0;

    const baseCandles: Candle[] = candles.map((c, i) => ({
      ...c,
      sourceIndex: i,
    }));

    function detectVAndNPatterns(candles: Candle[], level: number) {
      const windowSize = 7;

      for (let i = 0; i <= candles.length - windowSize; i++) {
        const group = candles.slice(i, i + windowSize);
        const directions = group.map((c) => c.close - c.open);

        const isV =
          directions.slice(0, 3).every((d) => d < 0) &&
          directions.slice(4).every((d) => d > 0);

        const isN =
          directions.slice(0, 3).every((d) => d > 0) &&
          directions.slice(4).every((d) => d < 0);

        if (isV || isN) {
          const targetCandle = isV
            ? group.reduce((min, c) => (c.low < min.low ? c : min))
            : group.reduce((max, c) => (c.high > max.high ? c : max));

          const targetIndexInAll = candles.findIndex(
            (c) => c.sourceIndex === targetCandle.sourceIndex,
          );

          const window = candles.slice(
            Math.max(0, targetIndexInAll - 5),
            Math.min(candles.length, targetIndexInAll + 6),
          );

          const isValid = isV
            ? window.every((c) => c.low >= targetCandle.low)
            : window.every((c) => c.high <= targetCandle.high);

          if (isValid) {
            patterns.push({
              type: isV ? 'V' : 'N',
              startIndex: group[0].sourceIndex!,
              endIndex: group[6].sourceIndex!,
              candles: group,
              fractalLevel: level,
            });
          }
        }
      }
    }

    detectVAndNPatterns(baseCandles, 0);

    for (let level = 1; level <= depth; level++) {
      const grouped: Candle[] = [];
      const groupSize = 2 ** level;

      for (let i = 0; i <= baseCandles.length - groupSize; i += groupSize) {
        const slice = baseCandles.slice(i, i + groupSize);
        const open = slice[0].open;
        const close = slice[slice.length - 1].close;
        const high = Math.max(...slice.map((c) => c.high));
        const low = Math.min(...slice.map((c) => c.low));
        const volume = slice.reduce((sum, c) => sum + (c.volume || 0), 0);
        const sourceIndex = slice[0].sourceIndex ?? i;

        grouped.push({ open, close, high, low, volume, sourceIndex });
      }

      detectVAndNPatterns(grouped, level);
    }

    return patterns;
  }

  async getZigZagPoints(
    symbol = 'BTC-USDT',
    interval = '15min',
    threshold = 1,
  ): Promise<ZigZagPoint[]> {
    const candles = await this.kucoinService.getCandles(symbol, interval);
    console.log(candles, 'candles');
    return calculateZigZagAdvanced(candles, threshold);
  }

  async detectCyclePattern(
    symbol = 'BTC-USDT',
    interval = '15min',
    maxWindow = 100,
  ): Promise<CyclePattern[]> {
    // گرفتن کندل‌ها
    const candles = await this.kucoinService.getCandles(symbol, interval);

    // ساختاردهی به کندل‌ها برای استفاده در الگوریتم
    const baseCandles: Candle[] = candles.map((c, i) => ({
      ...c,
      sourceIndex: i,
      timestamp: c.timestamp ?? Date.now() + i * 1000,
    }));

    const results: CyclePattern[] = [];

    // حلقه بررسی کندل‌ها برای یافتن نقطه A
    for (let i = 0; i < baseCandles.length - 20; i++) {
      const A = baseCandles[i];

      // ✅ بررسی اینکه A یک لوکال‌ های (سقف محلی) باشد در بازه‌ی 10 کندل قبل و بعد
      const rangeStartA = Math.max(0, i - 10);
      const rangeEndA = Math.min(baseCandles.length, i + 10);
      const localHighs = baseCandles.slice(rangeStartA, rangeEndA);
      const isLocalHigh = localHighs.every((c) => c.high <= A.high);
      if (!isLocalHigh) continue;

      // ✅ پیدا کردن B: اولین کندلی که کف آن پایین‌تر از A باشد
      let B: Candle | null = null;
      for (let j = i + 1; j < baseCandles.length; j++) {
        if (baseCandles[j].low < A.low) {
          B = baseCandles[j];
          break;
        }
      }
      if (!B) continue;

      const distanceAB = B.sourceIndex! - A.sourceIndex!;
      if (distanceAB < 4 || distanceAB > maxWindow) continue;

      // ✅ بررسی اینکه B یک لوکال لو باشد در 10 کندل اطراف خودش
      const rangeStartB = Math.max(0, B.sourceIndex! - 5);
      const rangeEndB = Math.min(baseCandles.length, B.sourceIndex! + 5);
      const localLows = baseCandles.slice(rangeStartB, rangeEndB);
      const isLocalLow = localLows.every((c) => c.low >= B!.low);
      if (!isLocalLow) continue;

      // ✅ پیدا کردن C: سقف بین B و D، به شرط اینکه high آن < high نقطه A باشد
      const startC = B.sourceIndex! + 1;
      const endC = startC + Math.floor(distanceAB / 2);
      const rangeC = baseCandles.slice(startC, endC);
      if (rangeC.length === 0) continue;

      const C = rangeC
        .filter((c) => c.high < A.high)
        .sort((a, b) => b.high - a.high)[0];
      if (!C) continue;

      // ✅ پیدا کردن D: کندلی بعد از C که low آن بالاتر از low نقطه B باشد
      const rangeD = baseCandles.slice(C.sourceIndex! + 1);
      const D = rangeD
        .filter((d) => d.low > B.low)
        .sort((a, b) => a.low - b.low)[0];
      if (!D) continue;

      // بررسی نظم فاصله‌ها
      const distanceBD = D.sourceIndex! - B.sourceIndex!;
      if (distanceBD !== Math.floor(distanceAB / 2)) continue;

      const distanceBC = C.sourceIndex! - B.sourceIndex!;

      // ذخیره‌سازی الگوی معتبر
      results.push({
        A,
        B,
        C,
        D,
        distanceAB,
        distanceBC,
        isValid: true,
      });
    }

    // بازگرداندن نتایج مرتب‌شده بر اساس زمان نقطه A
    return results.sort(
      (a, b) => (a.A.timestamp! ?? 0) - (b.A.timestamp! ?? 0),
    );
  }
}
