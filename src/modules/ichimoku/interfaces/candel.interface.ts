export default interface ICandel {
  open: number;
  close: number;
  high: number;
  low: number;
  volume?: number;
  openTime?: number;
  dateShamsi?: string;
  trend?: 'bullish' | 'bearish' | 'neutral';
}
