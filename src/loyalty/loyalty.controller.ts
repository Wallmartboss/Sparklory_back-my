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
  @ApiOperation({ summary: 'Get user purchase history' })
  @ApiResponse({ status: 200, description: 'User purchase history' })
  async getHistory(@UserDecorator('_id') userId: string) {
    // Returns the user's purchase history
    return this.loyaltyService.getHistory(userId);
  }

  /**
   * Returns the user's bonus balance.
   * @param userId User identifier
   */
  @Get('bonus')
  @ApiOperation({ summary: 'Get user bonus balance' })
  @ApiResponse({ status: 200, description: 'User bonus balance' })
  async getBonus(@UserDecorator('_id') userId: string) {
    // Returns the user's bonus balance
    return this.loyaltyService.getBonusBalance(userId);
  }

  /**
   * Adds or updates the user's loyalty card number.
   * @param userId User identifier
   * @param dto Card data
   */
  @Post('card')
  @ApiOperation({ summary: 'Bind loyalty card to user' })
  @ApiResponse({ status: 201, description: 'Loyalty card bound to user' })
  async addCard(@UserDecorator('_id') userId: string, @Body() dto: AddCardDto) {
    // Adds or updates the user's loyalty card number
    return this.loyaltyService.addCard(userId, dto.cardNumber);
  }

  /**
   * Adds a purchase to the user's history (for test/demo purposes)
   */
  @Post('add-purchase')
  async addPurchase(
    @UserDecorator('_id') userId: string,
    @Body() body: { amount: number; description?: string },
  ) {
    return this.loyaltyService.addPurchase(
      userId,
      body.amount,
      body.description,
    );
  }

  // --- Admin endpoints ---

  /**
   * Creates a new loyalty level (admin).
   * @param dto Level data
   */
  @Post('level')
  @ApiOperation({ summary: 'Create loyalty level (admin)' })
  @ApiResponse({ status: 201, description: 'Loyalty level created' })
  async createLevel(@Body() dto: CreateLoyaltyLevelDto) {
    // Creates a new loyalty level
    return this.loyaltyService.createLevel(dto.name, dto.bonusPercent);
  }

  /**
   * Updates the bonus percent for a loyalty level (admin).
   * @param id Level identifier
   * @param bonusPercent Bonus percent
   */
  @Patch('level/:id')
  @ApiOperation({ summary: 'Update loyalty level bonus percent (admin)' })
  @ApiResponse({ status: 200, description: 'Loyalty level updated' })
  async updateLevel(
    @Param('id') id: string,
    @Body('bonusPercent') bonusPercent: number,
  ) {
    // Updates the bonus percent for a loyalty level
    return this.loyaltyService.updateLevel(id, bonusPercent);
  }

  /**
   * Returns all loyalty levels (admin).
   */
  @Get('levels')
  @ApiOperation({ summary: 'Get all loyalty levels (admin)' })
  @ApiResponse({ status: 200, description: 'List of loyalty levels' })
  async getLevels() {
    // Returns all loyalty levels
    return this.loyaltyService.getLevels();
  }

  /**
   * Assigns a loyalty level to a user (admin).
   * @param userId User identifier
   * @param levelId Level identifier
   */
  @Patch('assign-level/:levelId')
  @ApiOperation({ summary: 'Assign loyalty level to user (admin)' })
  @ApiResponse({ status: 200, description: 'Loyalty level assigned to user' })
  @ApiBody({
    schema: {
      properties: {
        userId: {
          type: 'string',
          example: 'userObjectId',
          description: 'User ID',
        },
      },
    },
  })
  async assignLevel(
    @Body('userId') userId: string,
    @Param('levelId') levelId: string,
  ) {
    // Assigns a loyalty level to a user
    return this.loyaltyService.assignLevel(userId, levelId);
  }
}
