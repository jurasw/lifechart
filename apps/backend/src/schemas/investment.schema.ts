import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type InvestmentDocument = Investment & Document;

export type AssetType = 'stock' | 'crypto' | 'bond';
export type Currency = 'USD' | 'EUR' | 'PLN';

@Schema({ timestamps: true })
export class Investment {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  symbol: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, enum: ['stock', 'crypto', 'bond'] })
  type: AssetType;

  @Prop({ required: true, min: 0 })
  volume: number;

  @Prop({ required: true })
  purchaseDate: number;

  @Prop({ min: 0 })
  purchasePrice?: number;

  @Prop({ required: true, enum: ['USD', 'EUR', 'PLN'] })
  purchaseCurrency: Currency;

  @Prop()
  currentPrice?: number;

  @Prop()
  lastUpdated?: number;
}

export const InvestmentSchema = SchemaFactory.createForClass(Investment);

