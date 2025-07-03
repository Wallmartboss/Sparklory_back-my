import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { UserDecorator } from '../common/decorators/user.decorator';
import { AddCardDto } from './dto/add-card.dto';
import { CreateLoyaltyLevelDto } from './dto/create-loyalty-level.dto';
import { LoyaltyService } from './loyalty.service';

/**
 * Controller for loyalty program endpoints.
 */
@UseGuards(JwtAuthGuard)
@ApiTags('Loyalty')
@ApiBearerAuth('JWT-auth')
@Controller('loyalty')
export class LoyaltyController {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  /**
   * Returns the user's purchase history.
   * @param userId User identifier
   */
  @Get('history')
  @ApiOperation({ summary: 'Отримати історію покупок' })
  @ApiResponse({ status: 200, description: 'Історія покупок' })
  async getHistory(@UserDecorator('_id') userId: string) {
    // Повертає історію покупок користувача
    return this.loyaltyService.getHistory(userId);
  }

  /**
   * Returns the user's bonus balance.
   * @param userId User identifier
   */
  @Get('bonus')
  @ApiOperation({ summary: 'Отримати баланс бонусів' })
  @ApiResponse({ status: 200, description: 'Баланс бонусів' })
  async getBonus(@UserDecorator('_id') userId: string) {
    // Повертає баланс бонусів користувача
    return this.loyaltyService.getBonusBalance(userId);
  }

  /**
   * Adds or updates the user's loyalty card number.
   * @param userId User identifier
   * @param dto Card data
   */
  @Post('card')
  @ApiOperation({ summary: "Прив'язати карту лояльності" })
  @ApiResponse({ status: 201, description: "Карту прив'язано" })
  async addCard(@UserDecorator('_id') userId: string, @Body() dto: AddCardDto) {
    // Додає або оновлює номер карти лояльності
    return this.loyaltyService.addCard(userId, dto.cardNumber);
  }

  // --- Адмінські ендпоінти ---

  /**
   * Creates a new loyalty level (admin).
   * @param dto Level data
   */
  @Post('level')
  @ApiOperation({ summary: 'Створити рівень лояльності (адмін)' })
  @ApiResponse({ status: 201, description: 'Рівень лояльності створено' })
  async createLevel(@Body() dto: CreateLoyaltyLevelDto) {
    // Створює новий рівень лояльності
    return this.loyaltyService.createLevel(dto.name, dto.bonusPercent);
  }

  /**
   * Updates the bonus percent for a loyalty level (admin).
   * @param id Level identifier
   * @param bonusPercent Bonus percent
   */
  @Patch('level/:id')
  @ApiOperation({ summary: 'Оновити відсоток рівня лояльності (адмін)' })
  @ApiResponse({ status: 200, description: 'Рівень лояльності оновлено' })
  async updateLevel(
    @Param('id') id: string,
    @Body('bonusPercent') bonusPercent: number,
  ) {
    // Оновлює відсоток бонусу для рівня лояльності
    return this.loyaltyService.updateLevel(id, bonusPercent);
  }

  /**
   * Returns all loyalty levels (admin).
   */
  @Get('levels')
  @ApiOperation({ summary: 'Отримати всі рівні лояльності (адмін)' })
  @ApiResponse({ status: 200, description: 'Список рівнів лояльності' })
  async getLevels() {
    // Повертає всі рівні лояльності
    return this.loyaltyService.getLevels();
  }

  /**
   * Assigns a loyalty level to a user (admin).
   * @param userId User identifier
   * @param levelId Level identifier
   */
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
    // Призначає рівень лояльності користувачу
    return this.loyaltyService.assignLevel(userId, levelId);
  }
}
