import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as moment from 'moment-jalaali';

// نوع دقیق کندل KuCoin
type KuCoinCandle = [
  string, // time
  string, // open
  string, // close
  string, // high
  string, // low
  string, // volume
  number, // index
  any, // dateShamsi
  // string (turnover) - ignored here
];

// نوع ساختار پاسخ API
interface KuCoinCandleResponse {
  code: string;
  data: KuCoinCandle[];
}

@Injectable()
export class KucoinService {
  private readonly baseUrl: string;

  constructor(private configService: ConfigService) {
    this.baseUrl = this.configService.get<string>('KUCOIN_API_BASE_URL') || '';
  }

  async getCandles(
    symbol: string = 'BTC-USDT',
    interval = '15min',
    limit = 400,
  ) {
    const formattedSymbol = symbol.toUpperCase().replace('/', '-');

    // محاسبه زمان پایان و شروع بر اساس تایم‌فریم
    const endAt = Math.floor(Date.now() / 1000); // الان
    const duration =
      {
        '1min': 60,
        '5min': 300,
        '15min': 900,
        '30min': 1800,
        '1hour': 3600,
        '1day': 86400,
      }[interval] || 60;

    const startAt = endAt - limit * duration;

    const res = await axios.get<KuCoinCandleResponse>(
      `${this.baseUrl}/api/v1/market/candles`,
      {
        params: {
          symbol: formattedSymbol,
          type: interval,
          startAt,
          endAt,
        },
      },
    );
    // return res.data.data
    //   .map((candle, index) => {
    //     const timestamp = parseInt(candle[0]);

    //     const dateShamsi: any = moment
    //       .unix(timestamp)
    //       .format('jYYYY-jMM-jDD HH:mm:ss');

    //     return {
    //       timestamp: parseInt(candle[0]),
    //       open: parseFloat(candle[1]),
    //       close: parseFloat(candle[2]),
    //       high: parseFloat(candle[3]),
    //       low: parseFloat(candle[4]),
    //       volume: parseFloat(candle[5]),
    //       index,
    //       dateShamsi: dateShamsi,
    //     };
    //   })
    //   .sort((a, b) => a.timestamp - b.timestamp);

    return res.data.data
      .map((candle, index) => {
        const timestamp = parseInt(candle[0]);

        const open = parseFloat(candle[1]);
        const close = parseFloat(candle[2]);
        const high = parseFloat(candle[3]);
        const low = parseFloat(candle[4]);
        const volume = parseFloat(candle[5]);

        const dateShamsi = moment
          .unix(timestamp)
          .format('jYYYY-jMM-jDD HH:mm:ss');

        const trend =
          close > open ? 'bullish' : close < open ? 'bearish' : 'neutral';
        // صعودی = bullish
        return {
          timestamp,
          open,
          close,
          high,
          low,
          volume,
          index,
          dateShamsi,
          trend, // صعودی یا نزولی بودن کندل
        };
      })
      .sort((a, b) => a.timestamp - b.timestamp);
  }
}
