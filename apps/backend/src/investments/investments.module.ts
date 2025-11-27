import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InvestmentsService } from './investments.service';
import { InvestmentsController } from './investments.controller';
import { Investment, InvestmentSchema } from '../schemas/investment.schema';
import { PriceService } from '../services/price.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Investment.name, schema: InvestmentSchema }]),
  ],
  controllers: [InvestmentsController],
  providers: [InvestmentsService, PriceService],
  exports: [InvestmentsService],
})
export class InvestmentsModule {}

