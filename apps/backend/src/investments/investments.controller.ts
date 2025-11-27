import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { InvestmentsService } from './investments.service';
import { CreateInvestmentDto } from '../dto/create-investment.dto';
import { UpdateInvestmentDto } from '../dto/update-investment.dto';
import { ImportInvestmentsDto } from '../dto/import-investments.dto';
import { Request } from 'express';

@Controller('investments')
@UseGuards(AuthGuard('jwt'))
export class InvestmentsController {
  constructor(private readonly investmentsService: InvestmentsService) {}

  @Post()
  create(@Req() req: Request, @Body() createInvestmentDto: CreateInvestmentDto) {
    const userId = (req.user as any).userId;
    return this.investmentsService.create(userId, createInvestmentDto);
  }

  @Get()
  findAll(@Req() req: Request) {
    const userId = (req.user as any).userId;
    return this.investmentsService.findAll(userId);
  }

  @Post('update-prices')
  updatePrices(
    @Req() req: Request,
    @Body() updates: { id: string; currentPrice: number; lastUpdated: number }[],
  ) {
    const userId = (req.user as any).userId;
    return this.investmentsService.updatePrices(userId, updates);
  }

  @Post('import')
  async import(@Req() req: Request, @Body() importDto: ImportInvestmentsDto) {
    const userId = (req.user as any).userId;
    return this.investmentsService.import(userId, importDto.investments || []);
  }

  @Delete('clear-all')
  async clearAll(@Req() req: Request) {
    return this.investmentsService.clearAll();
  }

  @Get(':id')
  findOne(@Req() req: Request, @Param('id') id: string) {
    const userId = (req.user as any).userId;
    return this.investmentsService.findOne(userId, id);
  }

  @Patch(':id')
  update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() updateInvestmentDto: UpdateInvestmentDto,
  ) {
    const userId = (req.user as any).userId;
    return this.investmentsService.update(userId, id, updateInvestmentDto);
  }

  @Delete(':id')
  remove(@Req() req: Request, @Param('id') id: string) {
    const userId = (req.user as any).userId;
    return this.investmentsService.remove(userId, id);
  }
}
