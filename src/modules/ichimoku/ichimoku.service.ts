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
}
