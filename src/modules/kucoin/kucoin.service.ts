import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

// نوع دقیق کندل KuCoin
type KuCoinCandle = [
  string, // time
  string, // open
  string, // close
  string, // high
  string, // low
  string, // volume
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

  async getCandles(symbol: string, interval = '15min', limit = 2000) {
    // const formattedSymbol = symbol.toUpperCase().replace('/', '-');BTC - USDT;
    const formattedSymbol = 'BTC-USDT';

    // محاسبه زمان پایان و شروع بر اساس تایم‌فریم
    const endAt = Math.floor(Date.now() / 1000); // الان
    const duration =
      {
        '1min': 60,
        '5min': 300,
        '15min': 900,
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

    return res.data.data
      .map((candle) => ({
        timestamp: parseInt(candle[0]),
        open: parseFloat(candle[1]),
        close: parseFloat(candle[2]),
        high: parseFloat(candle[3]),
        low: parseFloat(candle[4]),
        volume: parseFloat(candle[5]),
      }))
      .sort((a, b) => a.timestamp - b.timestamp); // 🔧 این خط اضافه بشه
  }
}
