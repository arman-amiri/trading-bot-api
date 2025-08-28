import { Injectable } from '@nestjs/common';
import ICandel from '../interfaces/candel.interface';
import IAbcd from '../interfaces/abcd.interface';

@Injectable()
export class AbcdAtop21Service {
  constructor() {}

  findA(candles: ICandel[]): ICandel {
    const A = candles.reduce(
      (max, c) => (c.high > max.high ? c : max),
      candles[0],
    );
    return A;
  }

  isAOldest(A: ICandel, B: ICandel): boolean {
    return Boolean(A.openTime! < B.openTime!);
  }

  isAHighestBetween10(A: ICandel, allCandles: ICandel[]): boolean {
    // پیدا کردن ایندکس A در allCandles
    const indexInAll = allCandles.findIndex((c) => c === A);
    if (indexInAll === -1) return false; // اگر پیدا نشد

    // محدوده بررسی
    const start = Math.max(0, indexInAll - 10);
    const end = Math.min(allCandles.length - 1, indexInAll + 10);

    // بررسی اینکه A از همه بالاتر باشه
    for (let i = start; i <= end; i++) {
      if (i !== indexInAll && allCandles[i].high >= A.high) {
        return false; // شرط برقرار نیست
      }
    }
    return true;
  }

  findB(candles: ICandel[]): ICandel {
    const B = candles.reduce(
      (min, c) => (c.low < min.low ? c : min),
      candles[0],
    );
    return B;
  }

  findC(candles: ICandel[], B: ICandel, D: ICandel): ICandel {
    const start = Math.min(B.openTime!, D.openTime!);
    const end = Math.max(B.openTime!, D.openTime!);

    const candlesBetweenBAndD = candles.filter(
      (c) => c.openTime! >= start && c.openTime! <= end,
    );

    const C = candlesBetweenBAndD.reduce(
      (max, c) => (c.high > max.high ? c : max),
      candlesBetweenBAndD[0],
    );
    return C;
  }

  findD(candles: ICandel[]): ICandel {
    const D = candles[candles.length - 1];
    return D;
  }

  isDLowestThan1_3(D: ICandel, B: ICandel, candles: ICandel[]): boolean {
    const start = Math.min(B.openTime!, D.openTime!);
    const end = Math.max(B.openTime!, D.openTime!);

    // انتخاب کندل‌های بین B و D
    const candlesBetweenBAndD = candles.filter(
      (c) => c.openTime! >= start && c.openTime! <= end,
    );

    if (candlesBetweenBAndD.length < 3) return false; // اگر کمتر از 3 کندل داشتیم تقسیم بی‌معنی میشه

    // تقسیم به سه بخش
    const partSize = Math.floor(candlesBetweenBAndD.length / 3);
    const thirdPart = candlesBetweenBAndD.slice(-partSize); // یک‌سوم پایانی

    // پیدا کردن کمترین کندل در یک‌سوم پایانی
    // const lowestInThird = thirdPart.reduce(
    //   (min, c) => (c.low < min.low ? c : min),
    //   thirdPart[0],
    // );

    // بررسی اینکه D پایین‌تر از همه در بخش سوم باشه
    // بررسی اینکه D از همه کندل‌های بخش سوم پایین‌تر باشه
    return thirdPart.every((c) => {
      return D.low <= c.low;
    });
  }

  findCountBetweenAandB(candles: ICandel[], A: ICandel, B: ICandel) {
    const indexA = candles.findIndex((c) => c.openTime! === A.openTime!);
    const indexB = candles.findIndex((c) => c.openTime! === B.openTime!);
    const countBetweenAandB = Math.abs(indexB - indexA) + 1;
    return countBetweenAandB;
  }

  countBetweenBandD(candles: ICandel[], B: ICandel, D: ICandel) {
    const indexD = candles.findIndex((c) => c.openTime! === D.openTime!);
    const indexB = candles.findIndex((c) => c.openTime! === B.openTime!);

    const countBetweenBandD = Math.abs(indexD - indexB) + 1;
    return countBetweenBandD;
  }

  private findABCD(candles: ICandel[], minBoxSize: number, tolerance: number) {
    let result: IAbcd | undefined;
    const _candles = candles.slice(10);

    while (_candles.length > minBoxSize) {
      const D = this.findD(_candles);
      const B = this.findB(_candles);
      const C = this.findC(_candles, B, D);
      const A = this.findA(_candles);

      const isAHighest = this.isAHighestBetween10(A, candles);
      if (!isAHighest) return undefined;

      // A باید قدیمی ترین باشه
      const oldestA = this.isAOldest(A, B);
      if (!oldestA) return undefined;

      const countBetweenAandB = this.findCountBetweenAandB(_candles, A, B);
      const countBetweenBandD = this.countBetweenBandD(_candles, B, D);
      const isValid =
        Math.abs(countBetweenAandB - 2 * countBetweenBandD) <= tolerance;

      const isDLowestThan = this.isDLowestThan1_3(D, B, _candles);

      if (isValid && isDLowestThan) {
        result = {
          A,
          B,
          C,
          D,
          countBetweenAandB,
          countBetweenBandD,
        };
        break;
      }
      _candles.pop();
    }
    if (result) return result;
    return undefined;
  }

  detectABCD(
    candles: ICandel[],
    maxBoxSize: number,
    minBoxSize: number,
    tolerance: number,
  ) {
    const finalResult: IAbcd[] = [];
    const _maxBoxSize = maxBoxSize + 9;

    candles.map((candel, i) => {
      // i = 0 یعنی از انتهای آرایه شروع
      const start = -(i + _maxBoxSize + 1);
      const end = -i || candles.length; // چون -0 در JS همون 0 هست و slice(?, 0) خالی میشه

      const candlesBox = candles.slice(start, end);

      if (candlesBox.length == _maxBoxSize + 1) {
        const result = this.findABCD(candlesBox, minBoxSize, tolerance);
        if (result) finalResult.push(result);
      }
    });

    const uniqueResults: IAbcd[] = [];
    const seen = new Set();

    for (const item of finalResult) {
      const key = `${item.A._id}-${item.B._id}-${item.C._id}-${item.D._id}`;

      if (!seen.has(key)) {
        seen.add(key);
        uniqueResults.push(item);
      }
    }

    return {
      founded: finalResult.length,
      uniqueResultsfounded: uniqueResults.length,
      uniqueResults,
    };
  }

  findE(candles: ICandel[], abcd: IAbcd[]) {
    console.log(candles.length, abcd.length, '9999999999');
  }
}
