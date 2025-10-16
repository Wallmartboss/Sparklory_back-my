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
    summary: 'Get Nova Poshta cities list',
    description:
      'Retrieve list of cities from Nova Poshta API with fast filtering and caching. Returns real data from Nova Poshta API.',
  })
  @ApiQuery({
    name: 'cityName',
    required: false,
    description: 'City name to search for (supports partial matching)',
    example: 'Київ',
    schema: {
      type: 'string',
      default: 'Київ',
    },
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Maximum number of results (default: 100, max: 500)',
    example: 50,
    schema: {
      type: 'number',
      minimum: 1,
      maximum: 500,
      default: 100,
    },
  })
  @ApiResponse({
    status: 200,
    description: 'List of cities retrieved successfully',
  })
  async getCities(
    @Query('cityName') cityName?: string,
    @Query('limit') limit: number = 100,
  ) {
    const cities = await this.novaPoshtaService.getCities(cityName);

    // Apply limit if specified
    const maxLimit = Math.min(500, Math.max(1, Math.floor(limit)));
    const citiesArray = Array.isArray(cities) ? cities : [];
    const limitedCities = citiesArray.slice(0, maxLimit);

    return {
      total: citiesArray.length,
      returned: limitedCities.length,
      limit: maxLimit,
      cities: limitedCities,
    };
  }

  @Get('warehouses')
  @ApiOperation({
    summary: 'Get Nova Poshta warehouses by city',
    description:
      'Retrieve warehouses for a specific city from Nova Poshta API with pagination, filtering and caching support. Returns real warehouse data.',
  })
  @ApiQuery({
    name: 'cityRef',
    required: true,
    description: 'City reference ID',
    example: '8d5a980d-391c-11dd-90d9-001a92567626',
    schema: {
      type: 'string',
      pattern: '^[a-f0-9-]{36}$',
      default: '8d5a980d-391c-11dd-90d9-001a92567626',
    },
  })
  @ApiQuery({
    name: 'type',
    required: false,
    description:
      'Warehouse type (e.g., "Branch" for branches or "Postomat" for postomats)',
    example: 'Branch',
    schema: {
      type: 'string',
      enum: ['Branch', 'Postomat'],
      default: 'Branch',
    },
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search by warehouse name, description, or index number',
    example: '1',
    schema: {
      type: 'string',
      default: '',
    },
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number (default: 1)',
    example: 1,
    schema: {
      type: 'number',
      minimum: 1,
      default: 1,
    },
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Items per page (default: 100, max: 500)',
    example: 100,
    schema: {
      type: 'number',
      minimum: 1,
      maximum: 500,
      default: 100,
    },
  })
  @ApiResponse({
    status: 200,
    description:
      'List of warehouses retrieved successfully from Nova Poshta API',
    schema: {
      example: {
        total: 6500,
        page: 1,
        limit: 100,
        pages: 65,
        warehouses: [
          {
            Ref: '7b422fc3-e1b8-11e3-8c4a-0050568002cf',
            Description: 'Відділення №4 (до 200 кг): вул. Верховинна, 69',
            CityDescription: 'Київ',
            WarehouseIndex: '4',
          },
          {
            Ref: '7b422fc4-e1b8-11e3-8c4a-0050568002cf',
            Description: 'Поштомат №123',
            CityDescription: 'Київ',
            WarehouseIndex: '123',
          },
        ],
      },
    },
  })
  async getWarehouses(
    @Query('cityRef') cityRef: string,
    @Query('type') type?: string,
    @Query('search') search?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 100,
  ) {
    // Validate pagination parameters
    const validPage = Math.max(1, Math.floor(page));
    const validLimit = Math.min(500, Math.max(1, Math.floor(limit)));

    const warehouses = await this.novaPoshtaService.getWarehouses(
      cityRef,
      type,
      search,
    );

    // Apply pagination
    const startIndex = (validPage - 1) * validLimit;
    const endIndex = startIndex + validLimit;
    const paginatedWarehouses = warehouses.slice(startIndex, endIndex);

    return {
      total: warehouses.length,
      page: validPage,
      limit: validLimit,
      pages: Math.ceil(warehouses.length / validLimit),
      warehouses: paginatedWarehouses,
    };
  }

  @Get('delivery-cost')
  @ApiOperation({
    summary: 'Calculate Nova Poshta delivery cost with insurance',
    description:
      'Calculate real delivery cost from Nova Poshta API for a specific city, weight and cart total. Includes insurance calculation (0.5% of cart total). Uses real Nova Poshta pricing data.',
  })
  @ApiQuery({
    name: 'cityRef',
    required: true,
    description:
      'City reference ID for delivery destination (from Nova Poshta API)',
    example: '8d5a980d-391c-11dd-90d9-001a92567626',
    schema: {
      type: 'string',
      pattern: '^[a-f0-9-]{36}$',
      description: 'Nova Poshta city reference UUID',
      default: '8d5a980d-391c-11dd-90d9-001a92567626',
    },
  })
  @ApiQuery({
    name: 'warehouseRef',
    required: true,
    description:
      'Warehouse reference ID for delivery destination (from Nova Poshta API)',
    example: '7b422fc3-e1b8-11e3-8c4a-0050568002cf',
    schema: {
      type: 'string',
      pattern: '^[a-f0-9-]{36}$',
      description: 'Nova Poshta warehouse reference UUID',
      default: '7b422fc3-e1b8-11e3-8c4a-0050568002cf',
    },
  })
  @ApiQuery({
    name: 'weight',
    required: true,
    description: 'Package weight in kg (affects delivery cost)',
    example: 1.0,
    schema: {
      type: 'number',
      minimum: 0.1,
      maximum: 1000,
      description: 'Weight in kilograms',
      default: 1.0,
    },
  })
  @ApiQuery({
    name: 'cartTotal',
    required: false,
    description:
      'Cart total amount for insurance calculation (0.5% of cart total). Default: 1000',
    example: 1500,
    schema: {
      type: 'number',
      minimum: 0,
      maximum: 1000000,
      description: 'Cart total in UAH',
      default: 1500,
    },
  })
  @ApiResponse({
    status: 200,
    description:
      'Delivery cost calculated successfully using real Nova Poshta API data',
    type: DeliveryCostResponseDto,
    schema: {
      example: {
        deliveryCost: 67.5,
        insuranceCost: 7.5,
        totalCost: 75.0,
        cartTotal: 1500,
        insurancePercentage: 0.005,
      },
    },
  })
  @ApiResponse({
    status: 500,
    description:
      'Internal server error - falls back to mock data if Nova Poshta API is unavailable',
    schema: {
      example: {
        statusCode: 500,
        message: 'Internal server error',
      },
    },
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
    summary: 'Preload Nova Poshta cache for popular cities',
    description:
      'Preload warehouses cache for popular cities (Київ, Львів, Харків, Одеса, Дніпро) to improve API performance (admin only)',
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
    summary: 'Clear Nova Poshta cache',
    description:
      'Clear all Nova Poshta API cache (cities, warehouses, delivery costs) to force fresh data retrieval (admin only)',
  })
  @ApiResponse({
    status: 200,
    description: 'Cache cleared successfully',
  })
  async clearCache() {
    return this.novaPoshtaService.clearCache();
  }
}
