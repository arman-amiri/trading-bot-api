import { Injectable } from '@nestjs/common';
import { KucoinService } from '../kucoin/kucoin.service';

type Candle = {
  open: number;
  close: number;
  high: number;
  low: number;
  volume?: number;
  timestamp?: number;
  sourceIndex?: number; // ⬅ اضافه شد
};

export type PatternType = 'V' | 'I' | 'N';

export interface DetectedPattern {
  type: PatternType;
  index: number; // ⬅ این می‌ره برای تعیین کندلی که فلش روش بیفته
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

    const patterns: DetectedPattern[] = [];
    const depth = options.fractalDepth || 0;

    const baseCandles: Candle[] = candles.map((c, i) => ({
      ...c,
      sourceIndex: i, // ⬅ اندیس اصلی کندل
    }));

    function detectLevel(candles: Candle[], level: number) {
      for (let i = 2; i < candles.length; i++) {
        const a = candles[i - 2];
        const b = candles[i - 1];
        const d = candles[i];

        const dir1 = a.close - a.open;
        const dir2 = b.close - b.open;
        const dir3 = d.close - d.open;

        const idx = a.sourceIndex ?? i - 2; // fallback برای سطح 0

        // V Pattern
        if (dir1 < 0 && dir2 < 0 && dir3 > Math.abs(dir2)) {
          patterns.push({
            type: 'V',
            index: idx,
            candles: [a, b, d],
            fractalLevel: level,
          });
        }

        // I Pattern
        if (
          Math.sign(dir1) === Math.sign(dir2) &&
          Math.sign(dir2) === Math.sign(dir3) &&
          Math.abs(dir1) > 0 &&
          Math.abs(dir2) > 0 &&
          Math.abs(dir3) > 0
        ) {
          patterns.push({
            type: 'I',
            index: idx,
            candles: [a, b, d],
            fractalLevel: level,
          });
        }

        // N Pattern
        if (dir1 > 0 && dir2 < 0 && dir3 > 0) {
          const leg1 = dir1;
          const leg3 = dir3;
          if (Math.abs(leg3 - leg1) / Math.abs(leg1) < 0.3) {
            patterns.push({
              type: 'N',
              index: idx,
              candles: [a, b, d],
              fractalLevel: level,
            });
          }
        }
      }
    }

    detectLevel(baseCandles, 0);

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

        grouped.push({
          open,
          close,
          high,
          low,
          volume,
          sourceIndex, // ⬅ ثبت اندیس اصلی برای تشخیص کندل واقعی
        });
      }

      detectLevel(grouped, level);
    }

    return patterns;
  }
}
