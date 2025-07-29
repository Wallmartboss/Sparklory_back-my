import { Controller, Get, Logger, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DeliveryCostResponseDto } from './dto/delivery-cost-response.dto';
import { NovaPoshtaService } from './nova-poshta.service';

@ApiTags('Nova Poshta')
@Controller('nova-poshta')
export class NovaPoshtaController {
  private readonly logger = new Logger(NovaPoshtaController.name);

  constructor(private readonly novaPoshtaService: NovaPoshtaService) {}

  @Get('cities')
  @ApiOperation({
    summary: 'Get list of cities',
    description: 'Retrieve list of cities from Nova Poshta API',
  })
  @ApiQuery({
    name: 'cityName',
    required: false,
    description: 'City name to search for',
    example: 'Київ',
  })
  @ApiResponse({
    status: 200,
    description: 'List of cities retrieved successfully',
  })
  async getCities(@Query('cityName') cityName?: string) {
    return this.novaPoshtaService.getCities(cityName);
  }

  @Get('warehouses')
  @ApiOperation({
    summary: 'Get warehouses by city',
    description: 'Retrieve warehouses for a specific city',
  })
  @ApiQuery({
    name: 'cityRef',
    required: true,
    description: 'City reference ID',
    example: '8d5a980d-391c-11dd-90d9-001a92567626',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    description:
      'Warehouse type (e.g., "Branch" for branches or "Postomat" for postomats)',
    example: 'Branch',
  })
  @ApiResponse({
    status: 200,
    description: 'List of warehouses retrieved successfully',
  })
  async getWarehouses(
    @Query('cityRef') cityRef: string,
    @Query('type') type?: string,
  ) {
    return this.novaPoshtaService.getWarehouses(cityRef, type);
  }

  @Get('delivery-cost')
  @ApiOperation({
    summary: 'Calculate delivery cost with insurance',
    description:
      'Calculate delivery cost for a specific city, warehouse, weight and cart total with insurance (0.5% of cart total)',
  })
  @ApiQuery({
    name: 'cityRef',
    required: true,
    description: 'City reference ID for delivery destination',
    example: '8d5a980d-391c-11dd-90d9-001a92567626',
  })
  @ApiQuery({
    name: 'warehouseRef',
    required: true,
    description: 'Warehouse reference ID for delivery destination',
    example: '7b422fc3-e1b8-11e3-8c4a-0050568002cf',
  })
  @ApiQuery({
    name: 'weight',
    required: true,
    description: 'Package weight in kg',
    example: 1.0,
  })
  @ApiQuery({
    name: 'cartTotal',
    required: false,
    description:
      'Cart total amount for insurance calculation (0.5% of cart total)',
    example: 1500,
  })
  @ApiResponse({
    status: 200,
    description: 'Delivery cost calculated successfully',
    type: DeliveryCostResponseDto,
  })
  async getDeliveryCost(
    @Query('cityRef') cityRef: string,
    @Query('warehouseRef') warehouseRef: string,
    @Query('weight') weight: number,
    @Query('cartTotal') cartTotal?: number,
  ): Promise<DeliveryCostResponseDto> {
    return this.novaPoshtaService.getDeliveryCost(
      cityRef,
      warehouseRef,
      weight,
      cartTotal,
    );
  }

  @Post('preload-cache')
  @ApiOperation({
    summary: 'Preload cache for popular cities',
    description: 'Preload warehouses cache for popular cities (admin only)',
  })
  @ApiResponse({
    status: 200,
    description: 'Cache preloading started successfully',
  })
  async preloadCache() {
    // Popular cities: Kyiv, Lviv, Kharkiv, Odesa, Dnipro
    const popularCities = [
      '8d5a980d-391c-11dd-90d9-001a92567626', // Kyiv
      'db5c88f5-391c-11dd-90d9-001a92567626', // Lviv
      'db5c88e0-391c-11dd-90d9-001a92567626', // Kharkiv
      'db5c88d0-391c-11dd-90d9-001a92567626', // Odesa
      'db5c88f0-391c-11dd-90d9-001a92567626', // Dnipro
    ];

    // Start preloading in background
    this.novaPoshtaService.preloadWarehousesCache(popularCities);

    return { message: 'Cache preloading started for popular cities' };
  }

  @Post('clear-cache')
  @ApiOperation({
    summary: 'Clear cache',
    description: 'Clear Nova Poshta cache (admin only)',
  })
  @ApiResponse({
    status: 200,
    description: 'Cache cleared successfully',
  })
  async clearCache() {
    return this.novaPoshtaService.clearCache();
  }
}
