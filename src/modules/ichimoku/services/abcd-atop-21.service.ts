import { Injectable } from '@nestjs/common';
import ICandel from '../interfaces/candel.interface';
import IAbcd from '../interfaces/abcd.interface';

@Injectable()
export class AbcdAtop21Service {
  constructor() {}

  findA(candels: ICandel[]): ICandel {
    const A = candels.reduce(
      (max, c) => (c.high > max.high ? c : max),
      candels[0],
    );
    return A;
  }

  isAOldest(A: ICandel, B: ICandel): boolean {
    return Boolean(A.openTime! < B.openTime!);
  }

  findB(candels: ICandel[]): ICandel {
    const B = candels.reduce(
      (min, c) => (c.low < min.low ? c : min),
      candels[0],
    );
    return B;
  }

  findC(candels: ICandel[], B: ICandel, D: ICandel): ICandel {
    const start = Math.min(B.openTime!, D.openTime!);
    const end = Math.max(B.openTime!, D.openTime!);

    const candlesBetweenBAndD = candels.filter(
      (c) => c.openTime! >= start && c.openTime! <= end,
    );

    const C = candlesBetweenBAndD.reduce(
      (max, c) => (c.high > max.high ? c : max),
      candlesBetweenBAndD[0],
    );
    return C;
  }

  findD(candels: ICandel[]): ICandel {
    const D = candels[0];
    return D;
  }

  findCountBetweenAandB(candels: ICandel[], A: ICandel, B: ICandel) {
    const indexA = candels.findIndex((c) => c.openTime === A.openTime);
    const indexB = candels.findIndex((c) => c.openTime === B.openTime);
    const countBetweenAandB = Math.abs(indexB - indexA) + 1;
    return countBetweenAandB;
  }

  countBetweenBandD(candels: ICandel[], B: ICandel, D: ICandel) {
    const indexD = candels.findIndex((c) => c.openTime === D.openTime);
    const indexB = candels.findIndex((c) => c.openTime === B.openTime);

    const countBetweenBandD = Math.abs(indexD - indexB) + 1;
    return countBetweenBandD;
  }

  private findABCD(candels: ICandel[], minBoxSize: number, tolerance: number) {
    let result: IAbcd | undefined;
    // while (candels.length >= minBoxSize) {
    for (let i = candels.length; i >= candels.length; i--) {
      const D = this.findD(candels);
      const B = this.findB(candels);
      const C = this.findC(candels, B, D);
      const A = this.findA(candels);
      // A باید قدیمی ترین باشه
      const oldestA = this.isAOldest(A, B);
      if (!oldestA) return undefined;

      const countBetweenAandB = this.findCountBetweenAandB(candels, A, B);
      const countBetweenBandD = this.countBetweenBandD(candels, B, D);
      console.log(countBetweenAandB, countBetweenBandD);
      const isValid =
        Math.abs(countBetweenAandB - 2 * countBetweenBandD) <= tolerance;

      if (isValid) {
        result = {
          A,
          B,
          C,
          D,
          countBetweenAandB,
          countBetweenBandD,
        };
      }
      //   candels.pop();
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
    const _maxBoxSize = maxBoxSize + 10;
    for (let i = candles.length; i >= candles.length; i--) {
      const candelsBox = candles.slice(-_maxBoxSize);

      if (candelsBox.length == _maxBoxSize) {
        const result = this.findABCD(candelsBox, minBoxSize, tolerance);
        if (result) finalResult.push(result);
      }
      candles.pop();
    }
    return {
      finalResult,
      founded: finalResult.length,
    };
  }
}
