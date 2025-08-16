import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import axios from 'axios';
import * as moment from 'moment-jalaali';

interface Candle {
  symbol: string;
  interval: string;
  openTime: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

@Injectable()
export class HistoryService {
  constructor(@InjectModel('Candle') private candleModel: Model<Candle>) {}

  async fetchAndSaveCandles(
    symbol = 'BTC-USDT',
    interval = '15min',
    limit = 1500,
  ) {
    const now = Math.floor(Date.now() / 1000); // timestamp in seconds
    const endAt = now;
    const startAt = endAt - limit * 15 * 60; // 15 min candles

    const url = `https://api.kucoin.com/api/v1/market/candles?type=${interval}&symbol=${symbol}&startAt=${startAt}&endAt=${endAt}`;

    const { data } = await axios.get(url);
    const candles = data.data; // it's an array of arrays

    const formatted = candles.map((c) => ({
      symbol,
      interval,
      openTime: Number(c[0]),
      open: Number(c[1]),
      close: Number(c[2]),
      high: Number(c[3]),
      low: Number(c[4]),
      volume: Number(c[5]),
    }));

    // optional: clear previous data
    await this.candleModel.deleteMany({ symbol, interval });

    // insert new candles
    await this.candleModel.insertMany(formatted);

    return `${formatted.length} candles saved.`;
  }

  // تابعی برای دریافت تعداد زیادی کندل از کوکوین و ذخیره در دیتابیس
  async fetchLargeHistory(
    symbol = 'BTC-USDT', // نماد پیش‌فرض (BTC-USDT)
    interval = '15min', // تایم‌فریم پیش‌فرض (۱۵ دقیقه)
    totalCandles = 50000, // تعداد کل کندل‌هایی که می‌خوایم دریافت کنیم
  ) {
    const candlesPerRequest = 1500; // حداکثر تعداد کندل قابل دریافت در هر درخواست
    const intervalSeconds = 15 * 60; // ۱۵ دقیقه معادل ۹۰۰ ثانیه

    const now = Math.floor(Date.now() / 1000); // گرفتن زمان فعلی به صورت یونیکس (ثانیه)
    let endAt = now; // نقطه پایان بازه‌ی اول

    const result: any[] = []; // آرایه نهایی برای ذخیره تمام کندل‌ها

    const rounds = Math.ceil(totalCandles / candlesPerRequest); // محاسبه تعداد دفعات موردنیاز برای گرفتن تمام کندل‌ها

    for (let i = 0; i < rounds; i++) {
      // محاسبه نقطه شروع بازه فعلی
      const startAt = endAt - candlesPerRequest * intervalSeconds;

      // ساخت URL برای درخواست به API کوکوین
      const url = `https://api.kucoin.com/api/v1/market/candles?type=${interval}&symbol=${symbol}&startAt=${startAt}&endAt=${endAt}`;

      console.log(`Fetching ${i + 1}/${rounds}...`); // لاگ پیشرفت دریافت کندل‌ها

      // ارسال درخواست به API کوکوین
      const { data } = await axios.get(url);
      console.log(data, 'data');
      const raw = data.data; // داده خام کندل‌ها

      // اگر داده‌ای وجود نداشت، بریم سراغ مرحله بعدی
      if (!raw || raw.length === 0) {
        console.warn(`⚠️ No data returned in round ${i + 1}`);
        endAt = startAt;
        continue;
      }

      // تبدیل کندل‌ها به فرمت دلخواه برای ذخیره در دیتابیس
      const formatted = raw.map((c) => {
        const openTime = Number(c[0]);
        return {
          symbol,
          interval,
          openTime,
          open: Number(c[1]),
          close: Number(c[2]),
          high: Number(c[3]),
          low: Number(c[4]),
          volume: Number(c[5]),
          openDateJalali: moment
            .unix(openTime)
            .format('jYYYY-jMM-jDD HH:mm:ss'),
        };
      });

      // اضافه کردن کندل‌های این مرحله به آرایه نهایی
      result.push(...formatted);

      // عقب رفتن در زمان برای درخواست بعدی
      endAt = startAt;

      // کمی توقف برای جلوگیری از rate limit
      await new Promise((res) => setTimeout(res, 300));
    }

    console.log(`Saving ${result.length} candles to DB...`); // لاگ ذخیره‌سازی

    // حذف داده‌های قبلی برای این نماد و تایم‌فریم (اختیاری)
    await this.candleModel.deleteMany({ symbol, interval });

    // ذخیره همه کندل‌ها در دیتابیس
    await this.candleModel.insertMany(result);

    // پیام موفقیت
    return `${result.length} candles saved.`;
  }

  async get2Years() {
    const candles = await this.candleModel
      .find({ symbol: 'BTC-USDT', interval: '15min' })
      .sort({ openTime: 1 }) // از جدید به قدیم
      .lean();

    return candles;
  }
}
