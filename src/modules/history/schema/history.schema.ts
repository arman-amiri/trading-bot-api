import { Schema } from 'mongoose';

export const CandleSchema = new Schema({
  symbol: String,
  interval: String,
  openTime: Number,
  open: Number,
  high: Number,
  low: Number,
  close: Number,
  volume: Number,
  openDateJalali: String,
});
