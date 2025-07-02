import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserDecorator } from '../common/decorators/user.decorator';
import { AddCardDto } from './dto/add-card.dto';
import { CreateLoyaltyLevelDto } from './dto/create-loyalty-level.dto';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { LoyaltyService } from './loyalty.service';
// import { JwtAuthGuard } from '../auth/guards/jwt.guard'; // якщо потрібен guard

@ApiTags('Loyalty')
@ApiBearerAuth('JWT-auth')
@Controller('loyalty')
export class LoyaltyController {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  @Post('purchase')
  @ApiOperation({ summary: 'Додати покупку та нарахувати бонус' })
  @ApiResponse({ status: 201, description: 'Покупку додано, бонус нараховано' })
  async addPurchase(
    @UserDecorator('id') userId: string,
    @Body() dto: CreatePurchaseDto,
  ) {
    return this.loyaltyService.addPurchase(userId, dto.amount, dto.description);
  }

  @Get('history')
  @ApiOperation({ summary: 'Отримати історію покупок' })
  @ApiResponse({ status: 200, description: 'Історія покупок' })
  async getHistory(@UserDecorator('id') userId: string) {
    return this.loyaltyService.getHistory(userId);
  }

  @Get('bonus')
  @ApiOperation({ summary: 'Отримати баланс бонусів' })
  @ApiResponse({ status: 200, description: 'Баланс бонусів' })
  async getBonus(@UserDecorator('id') userId: string) {
    return this.loyaltyService.getBonusBalance(userId);
  }

  @Post('card')
  @ApiOperation({ summary: 'Прив\u2019язати карту лояльності' })
  @ApiResponse({ status: 201, description: 'Карту прив\u2019язано' })
  async addCard(@UserDecorator('id') userId: string, @Body() dto: AddCardDto) {
    return this.loyaltyService.addCard(userId, dto.cardNumber);
  }

  // --- Адмінські ендпоінти ---
  @Post('level')
  @ApiOperation({ summary: 'Створити рівень лояльності (адмін)' })
  @ApiResponse({ status: 201, description: 'Рівень лояльності створено' })
  async createLevel(@Body() dto: CreateLoyaltyLevelDto) {
    return this.loyaltyService.createLevel(dto.name, dto.bonusPercent);
  }

  @Patch('level/:id')
  @ApiOperation({ summary: 'Оновити відсоток рівня лояльності (адмін)' })
  @ApiResponse({ status: 200, description: 'Рівень лояльності оновлено' })
  async updateLevel(
    @Param('id') id: string,
    @Body('bonusPercent') bonusPercent: number,
  ) {
    return this.loyaltyService.updateLevel(id, bonusPercent);
  }

  @Get('levels')
  @ApiOperation({ summary: 'Отримати всі рівні лояльності (адмін)' })
  @ApiResponse({ status: 200, description: 'Список рівнів лояльності' })
  async getLevels() {
    return this.loyaltyService.getLevels();
  }

  @Patch('assign-level/:levelId')
  @ApiOperation({ summary: 'Призначити рівень лояльності користувачу (адмін)' })
  @ApiResponse({ status: 200, description: 'Рівень лояльності призначено' })
  @ApiBody({
    schema: {
      properties: {
        userId: {
          type: 'string',
          example: 'userObjectId',
          description: 'ID користувача',
        },
      },
    },
  })
  async assignLevel(
    @Body('userId') userId: string,
    @Param('levelId') levelId: string,
  ) {
    return this.loyaltyService.assignLevel(userId, levelId);
  }
}
