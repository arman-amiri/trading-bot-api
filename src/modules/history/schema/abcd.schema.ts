// schemas/abcd.schema.ts
import { Schema, Document } from 'mongoose';
import ICandel from 'src/modules/ichimoku/interfaces/candel.interface';

export interface IAbcdPattern {
  A: ICandel;
  B: ICandel;
  C: ICandel;
  D: ICandel;
  countBetweenAandB: number;
  countBetweenBandD: number;
}

export interface IAbcd extends Document {
  symbol: string;
  interval: string;
  patterns: IAbcdPattern[];
  founded: number;
  uniqueResultsfounded: number;
  createdAt: Date;
  updatedAt: Date;
}

export const CandelEmbeddedSchema = new Schema<ICandel>({
  _id: { type: Schema.Types.ObjectId, required: true },
  open: { type: Number, required: true },
  close: { type: Number, required: true },
  high: { type: Number, required: true },
  low: { type: Number, required: true },
  volume: { type: Number },
  openTime: { type: Number },
  dateShamsi: { type: String },
  openDateJalali: { type: String },
  trend: { type: String, enum: ['bullish', 'bearish', 'neutral'] },
  symbol: { type: String },
  interval: { type: String },
});

export const AbcdSchema = new Schema<IAbcd>(
  {
    symbol: { type: String, required: true },
    interval: { type: String, required: true },
    founded: { type: Number, required: true },
    uniqueResultsfounded: { type: Number, required: true },
    patterns: [
      {
        A: { type: CandelEmbeddedSchema, required: true },
        B: { type: CandelEmbeddedSchema, required: true },
        C: { type: CandelEmbeddedSchema, required: true },
        D: { type: CandelEmbeddedSchema, required: true },
        countBetweenAandB: { type: Number, required: true },
        countBetweenBandD: { type: Number, required: true },
      },
    ],
  },
  { timestamps: true },
);
