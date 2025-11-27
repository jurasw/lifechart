import { IsString, IsNumber, IsEnum, IsOptional, Min } from 'class-validator';

export type AssetType = 'stock' | 'crypto' | 'bond';
export type Currency = 'USD' | 'EUR' | 'PLN';

export class CreateInvestmentDto {
  @IsString()
  symbol: string;

  @IsString()
  name: string;

  @IsEnum(['stock', 'crypto', 'bond'])
  type: AssetType;

  @IsNumber()
  @Min(0)
  volume: number;

  @IsNumber()
  purchaseDate: number;

  @IsNumber()
  @Min(0)
  purchasePrice: number;

  @IsEnum(['USD', 'EUR', 'PLN'])
  purchaseCurrency: Currency;

  @IsOptional()
  @IsNumber()
  @Min(0)
  currentPrice?: number;

  @IsOptional()
  @IsNumber()
  lastUpdated?: number;
}

