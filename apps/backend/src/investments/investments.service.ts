import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Investment, InvestmentDocument } from '../schemas/investment.schema';
import { CreateInvestmentDto } from '../dto/create-investment.dto';
import { UpdateInvestmentDto } from '../dto/update-investment.dto';
import { PriceService } from '../services/price.service';

@Injectable()
export class InvestmentsService {
  constructor(
    @InjectModel(Investment.name) private investmentModel: Model<InvestmentDocument>,
    private priceService: PriceService,
  ) {}

  async create(userId: string, createInvestmentDto: CreateInvestmentDto): Promise<any> {
    const investment = new this.investmentModel({
      ...createInvestmentDto,
      userId: new Types.ObjectId(userId),
    });
    const saved = await investment.save();
    return {
      ...saved.toObject(),
      id: saved._id.toString(),
    };
  }

  private isPolishAsset(symbol: string, type: string): boolean {
    const symbolUpper = symbol.toUpperCase();
    return (
      symbolUpper.includes('.WA') ||
      symbolUpper.includes('.PL') ||
      (type === 'bond' && symbolUpper.startsWith('PL')) ||
      (type === 'bond' && (symbolUpper.startsWith('OS') || symbolUpper.startsWith('EDO')))
    );
  }

  private calculateProfitLoss(inv: any): { profit: number; profitPercent: number } {
    const purchasePrice = inv.purchasePrice || 0;
    const currentPrice = inv.currentPrice;
    const volume = inv.volume;
    const purchaseCurrency = inv.purchaseCurrency || 'PLN';
    const isPolish = this.isPolishAsset(inv.symbol, inv.type);

    if (!currentPrice || purchasePrice <= 0 || !volume || volume <= 0) {
      return { profit: 0, profitPercent: 0 };
    }

    let currentPriceInPurchaseCurrency = currentPrice;
    
    if (isPolish && purchaseCurrency === 'PLN') {
      currentPriceInPurchaseCurrency = currentPrice;
    } else if (!isPolish && purchaseCurrency === 'USD') {
      currentPriceInPurchaseCurrency = currentPrice;
    } else if (isPolish && purchaseCurrency !== 'PLN') {
      return { profit: 0, profitPercent: 0 };
    } else if (!isPolish && purchaseCurrency !== 'USD') {
      return { profit: 0, profitPercent: 0 };
    }

    const totalCost = volume * purchasePrice;
    const totalValue = volume * currentPriceInPurchaseCurrency;
    const profit = totalValue - totalCost;
    const profitPercent = purchasePrice > 0 ? ((currentPriceInPurchaseCurrency - purchasePrice) / purchasePrice) * 100 : 0;

    return { profit, profitPercent };
  }

  async findAll(userId: string): Promise<any[]> {
    const userIdObjectId = new Types.ObjectId(userId);
    const investments = await this.investmentModel.find({ 
      $or: [
        { userId: userIdObjectId },
        { userId: userId }
      ]
    }).sort({ createdAt: -1 }).lean().exec();
    
    const result = investments.map((inv: any) => ({
      ...inv,
      id: inv._id.toString(),
    }));
    
    if (investments.length === 0) {
      return result;
    }
    
    try {
      const symbols = investments.map((inv: any) => ({
        symbol: inv.symbol,
        type: inv.type,
      }));
      
      const priceMap = await this.priceService.fetchMultiplePrices(symbols);
      
      return result.map((inv: any) => {
        const symbolUpper = inv.symbol.toUpperCase();
        const priceData = priceMap.get(symbolUpper);
        let currentPrice = inv.currentPrice;
        let lastUpdated = inv.lastUpdated;
        
        if (!priceData) {
          const symbolWithoutExchange = symbolUpper.replace(/\.(WA|PL|DE|L|PA|AS|MI|BR|LS|MC|VI|SW|ST|OL|HE|CO|IC|IR|AT)$/, '');
          const priceDataWithoutExchange = priceMap.get(symbolWithoutExchange);
          if (priceDataWithoutExchange) {
            currentPrice = priceDataWithoutExchange.price;
            lastUpdated = priceDataWithoutExchange.timestamp;
          }
        } else {
          currentPrice = priceData.price;
          lastUpdated = priceData.timestamp;
        }

        const { profit, profitPercent } = this.calculateProfitLoss({
          ...inv,
          currentPrice,
        });

        return {
          ...inv,
          currentPrice,
          lastUpdated,
          profit,
          profitPercent,
        };
      });
    } catch (error) {
      return result.map((inv: any) => {
        const { profit, profitPercent } = this.calculateProfitLoss(inv);
        return {
          ...inv,
          profit,
          profitPercent,
        };
      });
    }
  }

  async findOne(userId: string, id: string): Promise<any> {
    const investment = await this.investmentModel.findById(id).exec();
    if (!investment) {
      throw new NotFoundException('Investment not found');
    }
    if (investment.userId.toString() !== userId) {
      throw new ForbiddenException('You do not have access to this investment');
    }
    return {
      ...investment.toObject(),
      id: investment._id.toString(),
    };
  }

  async update(userId: string, id: string, updateInvestmentDto: UpdateInvestmentDto): Promise<any> {
    const investment = await this.investmentModel.findById(id).exec();
    if (!investment) {
      throw new NotFoundException('Investment not found');
    }
    if (investment.userId.toString() !== userId) {
      throw new ForbiddenException('You do not have access to this investment');
    }
    Object.assign(investment, updateInvestmentDto);
    const saved = await investment.save();
    return {
      ...saved.toObject(),
      id: saved._id.toString(),
    };
  }

  async remove(userId: string, id: string): Promise<void> {
    const investment = await this.investmentModel.findById(id).exec();
    if (!investment) {
      throw new NotFoundException('Investment not found');
    }
    if (investment.userId.toString() !== userId) {
      throw new ForbiddenException('You do not have access to this investment');
    }
    await investment.deleteOne();
  }

  async updatePrices(userId: string, updates: { id: string; currentPrice: number; lastUpdated: number }[]): Promise<void> {
    const updatePromises = updates.map((update) =>
      this.investmentModel.findOneAndUpdate(
        { _id: update.id, userId },
        { currentPrice: update.currentPrice, lastUpdated: update.lastUpdated },
        { new: true },
      ),
    );
    await Promise.all(updatePromises);
  }

  async import(userId: string, investments: any[]): Promise<{ created: number; skipped: number }> {
    let created = 0;
    let skipped = 0;

    const userIdObjectId = new Types.ObjectId(userId);

    if (!Array.isArray(investments) || investments.length === 0) {
      return { created: 0, skipped: 0 };
    }

    const existingInvestments = await this.investmentModel.find({ userId: userIdObjectId }).exec();
    const existingKeys = new Set(
      existingInvestments.map(inv => 
        `${inv.symbol}-${inv.purchaseDate}-${inv.purchasePrice ?? 'null'}-${inv.volume}`
      )
    );

    for (let i = 0; i < investments.length; i++) {
      const inv = investments[i];
      
      try {
        if (!inv || typeof inv !== 'object') {
          throw new Error('Invalid investment data: not an object');
        }

        const { id, ...investmentData } = inv;
        
        if (!investmentData.symbol || typeof investmentData.symbol !== 'string' || investmentData.symbol.trim().length === 0) {
          throw new Error('Invalid investment: missing or empty symbol');
        }
        if (!investmentData.name || typeof investmentData.name !== 'string' || investmentData.name.trim().length === 0) {
          throw new Error('Invalid investment: missing or empty name');
        }
        if (typeof investmentData.volume !== 'number' || isNaN(investmentData.volume)) {
          throw new Error('Invalid investment: volume must be a number');
        }
        if (typeof investmentData.purchaseDate !== 'number' || isNaN(investmentData.purchaseDate)) {
          throw new Error('Invalid investment: purchaseDate must be a number');
        }
        if (investmentData.purchasePrice !== null && investmentData.purchasePrice !== undefined) {
          if (typeof investmentData.purchasePrice !== 'number' || isNaN(investmentData.purchasePrice)) {
            throw new Error('Invalid investment: purchasePrice must be a number or null');
          }
          if (investmentData.purchasePrice < 0) {
            throw new Error('Invalid investment: purchasePrice cannot be negative');
          }
        }
        
        if (!investmentData.purchaseCurrency) {
          investmentData.purchaseCurrency = 'PLN';
        }
        
        const duplicateKey = `${investmentData.symbol}-${investmentData.purchaseDate}-${investmentData.purchasePrice ?? 'null'}-${investmentData.volume}`;
        if (existingKeys.has(duplicateKey)) {
          skipped++;
          continue;
        }

        const investment = new this.investmentModel({
          ...investmentData,
          userId: userIdObjectId,
        });
        await investment.save();
        existingKeys.add(duplicateKey);
        created++;
      } catch (error: any) {
        skipped++;
      }
    }
    return { created, skipped };
  }

  async clearAll(): Promise<{ deleted: number }> {
    const result = await this.investmentModel.deleteMany({}).exec();
    const deleted = result.deletedCount || 0;
    return { deleted };
  }
}

