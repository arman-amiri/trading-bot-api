export default interface ICandel {
  _id: object;
  open: number;
  close: number;
  high: number;
  low: number;
  volume?: number;
  openTime?: number;
  dateShamsi?: string;
  openDateJalali?: string;
  trend?: 'bullish' | 'bearish' | 'neutral';
  symbol?: string;
  interval?: string;
}
