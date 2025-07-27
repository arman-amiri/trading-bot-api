// zigzag.util.ts

export type ZigZagPoint = {
  time: number;
  price: number;
  type: 'peak' | 'valley';
};

type Candle = {
  high: number;
  low: number;
  close: number;
  timestamp: number;
};

export function calculateZigZagAdvanced(
  candles: Candle[],
  deviationPercent = 2,
): ZigZagPoint[] {
  if (candles.length < 2) return [];

  const result: ZigZagPoint[] = [];

  let lastPivotIndex = 0;
  let lastPivotType: 'peak' | 'valley' | null = null;

  // تابع کمک‌کننده برای درصد تغییر
  const getDeviation = (a: number, b: number) => Math.abs((a - b) / b) * 100;

  for (let i = 1; i < candles.length - 1; i++) {
    const prev = candles[i - 1];
    const curr = candles[i];
    const next = candles[i + 1];

    // تشخیص Swing High (peak)
    const isPeak = curr.high > prev.high && curr.high > next.high;

    // تشخیص Swing Low (valley)
    const isValley = curr.low < prev.low && curr.low < next.low;

    if (!isPeak && !isValley) continue;

    const type = isPeak ? 'peak' : 'valley';
    const price = isPeak ? curr.high : curr.low;

    const lastPivot = candles[lastPivotIndex];
    const lastPrice = lastPivotType === 'peak' ? lastPivot.high : lastPivot.low;

    const deviation = getDeviation(price, lastPrice);

    // اگه deviation کافی نباشه، نویزه
    if (lastPivotType !== null && deviation < deviationPercent) {
      continue;
    }

    // اگر چند swing پشت سر هم از یک نوع بودن، فقط قوی‌ترین رو نگه دار
    if (lastPivotType === type) {
      const currentStronger =
        (type === 'peak' && price > lastPrice) ||
        (type === 'valley' && price < lastPrice);

      if (currentStronger) {
        result.pop(); // حذف قبلی
      } else {
        continue; // قبلی بهتره، فعلی رو رد کن
      }
    }

    result.push({
      time: curr.timestamp,
      price,
      type,
    });

    lastPivotIndex = i;
    lastPivotType = type;
  }

  return result;
}
