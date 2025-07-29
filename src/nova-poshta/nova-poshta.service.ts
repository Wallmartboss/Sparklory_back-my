import { HttpService } from '@nestjs/axios';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cache } from 'cache-manager';
import { firstValueFrom } from 'rxjs';
import { DeliveryCostResponseDto } from './dto/delivery-cost-response.dto';

@Injectable()
export class NovaPoshtaService {
  private readonly logger = new Logger(NovaPoshtaService.name);
  private readonly apiUrl: string;
  private readonly apiKey: string;
  private readonly cacheTtl = 3600; // 1 hour cache

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    this.apiUrl = this.configService.get<string>('NOVA_POSHTA_API_URL');
    this.apiKey = this.configService.get<string>('NOVA_POSHTA_API_KEY');
    if (!this.apiUrl || !this.apiKey) {
      throw new Error('Nova Poshta API credentials are not configured');
    }
  }

  /**
   * Execute a request to Nova Poshta API with timeout
   * @param model Model name (e.g., "Address")
   * @param method Method name (e.g., "getCities")
   * @param methodProperties Method properties
   */
  async request<T = unknown>(
    model: string,
    method: string,
    methodProperties: Record<string, unknown> = {},
  ): Promise<T> {
    const body = {
      apiKey: this.apiKey,
      modelName: model,
      calledMethod: method,
      methodProperties,
    };

    this.logger.debug(`Nova Poshta request: ${JSON.stringify(body)}`);

    try {
      const { data } = await firstValueFrom(
        this.httpService.post(this.apiUrl, body, {
          timeout: 10000, // 10 seconds timeout
        }),
      );

      this.logger.debug(
        `Nova Poshta API response: ${JSON.stringify(data, null, 2)}`,
      );

      if (!data.success) {
        this.logger.error(
          `Nova Poshta API error: ${JSON.stringify(data.errors)}`,
        );
        this.logger.error(`Full API response: ${JSON.stringify(data)}`);
        throw new Error(`Nova Poshta API error: ${data.errors?.join(', ')}`);
      }

      return data.data;
    } catch (error) {
      this.logger.error(`Nova Poshta API request failed: ${error.message}`);
      throw new Error(`Nova Poshta API request failed: ${error.message}`);
    }
  }

  /**
   * Оставляет только нужные поля склада для ответа API
   */
  private mapWarehouse(warehouse: any) {
    return {
      Ref: warehouse.Ref,
      Description: warehouse.Description,
      CityDescription: warehouse.CityDescription,
      WarehouseIndex:
        warehouse.WarehouseIndex ||
        warehouse.Number ||
        warehouse.SiteKey ||
        null,
    };
  }

  /**
   * Get list of cities with caching
   * @param cityName Optional city name to search
   */
  async getCities(cityName?: string) {
    const cacheKey = `cities:${cityName || 'all'}`;

    // Try to get from cache first
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      this.logger.debug(`Returning cached cities for: ${cityName || 'all'}`);
      return cached;
    }

    // If not in cache, fetch from API
    this.logger.debug(`Fetching cities from API for: ${cityName || 'all'}`);
    const result = await this.request(
      'Address',
      'getCities',
      cityName ? { FindByString: cityName } : {},
    );

    // Cache the result
    await this.cacheManager.set(cacheKey, result, this.cacheTtl);

    return result;
  }

  /**
   * Get warehouses by city reference with caching and optimization
   * @param cityRef City reference
   */
  async getWarehouses(cityRef: string, type?: string) {
    const cacheKey = `warehouses:${cityRef}:all`; // Always cache all warehouses for city
    const startTime = Date.now();

    try {
      // Try to get from cache first
      const cached = await this.cacheManager.get(cacheKey);
      if (cached) {
        this.logger.debug(
          `Returning cached warehouses for city: ${cityRef} (${Date.now() - startTime}ms)`,
        );

        let filtered = Array.isArray(cached) ? cached : [];
        if (type) {
          // Filter by type from cached data
          filtered = filtered.filter(w => {
            const warehouseType =
              w.CategoryOfWarehouse ||
              w.TypeOfWarehouse ||
              w.WarehouseType ||
              w.Type ||
              w.Category;
            return warehouseType === type;
          });
        }
        // Map warehouses AFTER filtering to preserve type fields for filtering
        filtered = filtered.map(this.mapWarehouse);
        this.logger.debug(
          `Filtered warehouses for type '${type || 'all'}': ${filtered.length}`,
        );
        return filtered;
      }

      // If not in cache, fetch from API
      this.logger.debug(`Fetching warehouses from API for city: ${cityRef}`);

      // Try faster method first (AddressGeneral/getWarehouses)
      let result;
      try {
        result = await this.request('AddressGeneral', 'getWarehouses', {
          CityRef: cityRef,
        });
      } catch (error) {
        this.logger.warn(
          `Fast method failed, trying alternative: ${error.message}`,
        );
        // Fallback to Address/getWarehouses if AddressGeneral fails
        result = await this.request('Address', 'getWarehouses', {
          CityRef: cityRef,
        });
      }

      // Cache the result (always cache all warehouses for the city)
      await this.cacheManager.set(cacheKey, result, this.cacheTtl);

      this.logger.debug(
        `Warehouses fetched and cached for city: ${cityRef} (${Date.now() - startTime}ms)`,
      );

      let filtered = Array.isArray(result) ? result : [];
      if (type) {
        // Filter by type from fetched data
        filtered = filtered.filter(w => {
          const warehouseType =
            w.CategoryOfWarehouse ||
            w.TypeOfWarehouse ||
            w.WarehouseType ||
            w.Type ||
            w.Category;
          return warehouseType === type;
        });
      }
      // Map warehouses AFTER filtering to preserve type fields for filtering
      filtered = filtered.map(this.mapWarehouse);
      this.logger.debug(
        'After filtering warehouses:',
        Array.isArray(filtered),
        typeof filtered,
        Array.isArray(filtered) ? filtered.length : undefined,
      );
      return filtered;
    } catch (error) {
      this.logger.error(
        `Failed to get warehouses for city ${cityRef}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Get warehouse reference by warehouse name and city reference
   * @param cityRef City reference
   * @param warehouseName Warehouse name/description
   * @returns Warehouse reference (Ref) or null if not found
   */
  async getWarehouseRefByName(
    cityRef: string,
    warehouseName: string,
  ): Promise<string | null> {
    const cacheKey = `warehouse_ref_by_name:${cityRef}:${warehouseName}`;

    // Try to get from cache first
    const cached = await this.cacheManager.get<string>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      // Get all warehouses for the city
      const warehouses = await this.getWarehouses(cityRef);

      // Find warehouse by name (case-insensitive search)
      const warehouse = warehouses.find(
        w =>
          w.Description?.toLowerCase().includes(warehouseName.toLowerCase()) ||
          w.ShortAddress?.toLowerCase().includes(warehouseName.toLowerCase()) ||
          w.Number === warehouseName,
      );

      if (warehouse) {
        const warehouseRef = warehouse.Ref;
        // Cache the result
        await this.cacheManager.set(cacheKey, warehouseRef, this.cacheTtl);
        return warehouseRef;
      }

      return null;
    } catch (error) {
      this.logger.error(
        `Failed to get warehouse ref for city ${cityRef}, name ${warehouseName}: ${error.message}`,
      );
      return null;
    }
  }

  /**
   * Get warehouse reference by warehouse index and city reference
   * @param cityRef City reference
   * @param warehouseIndex Warehouse index/number
   * @returns Warehouse reference (Ref) or null if not found
   */
  async getWarehouseRefByIndex(
    cityRef: string,
    warehouseIndex: string,
  ): Promise<string | null> {
    const cacheKey = `warehouse_ref:${cityRef}:${warehouseIndex}`;

    // Try to get from cache first
    const cached = await this.cacheManager.get<string>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      // Get all warehouses for the city
      const warehouses = await this.getWarehouses(cityRef);

      // Find warehouse by index
      const warehouse = warehouses.find(
        w => w.WarehouseIndex === warehouseIndex || w.Ref === warehouseIndex, // Also check if warehouseIndex is actually a Ref
      );

      if (warehouse) {
        const warehouseRef = warehouse.Ref;
        // Cache the result
        await this.cacheManager.set(cacheKey, warehouseRef, this.cacheTtl);
        return warehouseRef;
      }

      return null;
    } catch (error) {
      this.logger.error(
        `Failed to get warehouse ref for city ${cityRef}, index ${warehouseIndex}: ${error.message}`,
      );
      return null;
    }
  }

  /**
   * Get delivery cost calculation with insurance using warehouse index
   * @param cityRef City reference for destination
   * @param warehouseIndex Warehouse index/number for destination
   * @param weight Package weight
   * @param cartTotal Cart total for insurance calculation
   */
  async getDeliveryCostByWarehouseIndex(
    cityRef: string,
    warehouseIndex: string,
    weight: number,
    cartTotal: number = 0,
  ): Promise<DeliveryCostResponseDto> {
    // Get warehouse reference by index
    const warehouseRef = await this.getWarehouseRefByIndex(
      cityRef,
      warehouseIndex,
    );

    if (!warehouseRef) {
      throw new Error(
        `Warehouse with index ${warehouseIndex} not found in city ${cityRef}`,
      );
    }

    // Use the existing method with warehouse reference
    return this.getDeliveryCost(cityRef, warehouseRef, weight, cartTotal);
  }

  /**
   * Get delivery cost calculation with insurance
   * @param cityRef City reference for destination
   * @param warehouseRef Warehouse reference for destination
   * @param weight Package weight
   * @param cartTotal Cart total for insurance calculation
   */
  async getDeliveryCost(
    cityRef: string,
    warehouseRef: string,
    weight: number,
    cartTotal: number = 0,
  ): Promise<DeliveryCostResponseDto> {
    // Get sender city and warehouse from environment variables
    const senderCityRef = this.configService.get<string>(
      'NOVA_POSHTA_CITY_REF',
    );
    const senderWarehouseName = this.configService.get<string>(
      'NOVA_POSHTA_WAREHOUSE_NAME',
    );

    if (!senderCityRef || !senderWarehouseName) {
      throw new Error(
        'Nova Poshta sender configuration is missing in environment variables (NOVA_POSHTA_CITY_REF and NOVA_POSHTA_WAREHOUSE_NAME)',
      );
    }

    // Get sender warehouse reference by name
    const senderWarehouseRef = await this.getWarehouseRefByName(
      senderCityRef,
      senderWarehouseName,
    );

    if (!senderWarehouseRef) {
      throw new Error(
        `Sender warehouse with name "${senderWarehouseName}" not found in city ${senderCityRef}`,
      );
    }

    const cacheKey = `delivery_cost:${senderCityRef}:${senderWarehouseName}:${cityRef}:${warehouseRef}:${weight}:${cartTotal}`;

    const cached =
      await this.cacheManager.get<DeliveryCostResponseDto>(cacheKey);
    if (cached) {
      return cached;
    }

    const result = await this.request('InternetDocument', 'getDocumentPrice', {
      CitySender: senderCityRef,
      WarehouseSender: senderWarehouseRef, // Add specific sender warehouse
      CityRecipient: cityRef,
      WarehouseRecipient: warehouseRef, // Add specific warehouse for recipient
      Weight: weight,
      ServiceType: 'WarehouseWarehouse',
      Cost: cartTotal || 1000, // Use cart total for insurance calculation
      CargoType: 'Parcel', // Changed from 'Cargo' to 'Parcel' as suggested by API
      SeatsAmount: 1,
      DateTime: new Date().toLocaleDateString('uk-UA'),
      PaymentMethod: 'Cash',
      PayerType: 'Sender',
      DeliveryType: 'WarehouseWarehouse',
      VolumeGeneral: '0.0004',
      // Additional required parameters
      CargoDetails: [
        {
          CargoDescription: 'Прикраси',
          Amount: 1,
          Weight: '0.5',
          Volume: '0.0004',
        },
      ],
      PackCalculate: {
        PackCount: 1,
        PackRef: '14945687-76a8-11de-8a39-000c2965ae0e',
      },
      // Required for cost calculation
      RedeliveryCalculate: {
        CargoType: 'Money',
        Amount: 0,
      },
    });

    // Calculate insurance cost (0.5% of cart total)
    const insurancePercentage = 0.005; // 0.5%
    const insuranceCost = cartTotal * insurancePercentage;

    // Extract delivery cost from Nova Poshta response
    const deliveryCost =
      Array.isArray(result) && result.length > 0 ? result[0].Cost || 0 : 0;

    const response = {
      deliveryCost,
      insuranceCost: Math.round(insuranceCost * 100) / 100, // Round to 2 decimal places
      totalCost: Math.round((deliveryCost + insuranceCost) * 100) / 100,
      cartTotal,
      insurancePercentage,
    };

    await this.cacheManager.set(cacheKey, response, this.cacheTtl);
    return response as DeliveryCostResponseDto;
  }

  /**
   * Preload cache for popular cities
   * @param cityRefs Array of city references to preload
   */
  async preloadWarehousesCache(cityRefs: string[]) {
    this.logger.debug(
      `Preloading warehouses cache for ${cityRefs.length} cities`,
    );

    const promises = cityRefs.map(async cityRef => {
      try {
        await this.getWarehouses(cityRef); // Preload all warehouses for city
        this.logger.debug(`Preloaded cache for city: ${cityRef}`);
      } catch (error) {
        this.logger.warn(
          `Failed to preload cache for city ${cityRef}: ${error.message}`,
        );
      }
    });

    await Promise.allSettled(promises);
    this.logger.debug('Warehouses cache preloading completed');
  }

  /**
   * Clear cache for specific keys or all cache
   * @param pattern Cache key pattern to clear
   */
  async clearCache(pattern?: string) {
    try {
      if (pattern) {
        this.logger.debug(`Clearing cache for pattern: ${pattern}`);
        // For specific patterns, clear common Nova Poshta cache patterns
        const commonKeys = [
          `cities:${pattern}`,
          `warehouses:${pattern}:all`,
          `warehouses:${pattern}:Branch`,
          `warehouses:${pattern}:Postomat`,
        ];

        for (const key of commonKeys) {
          await this.cacheManager.del(key);
        }
      } else {
        // Clear all cache - note: cache-manager doesn't have reset method
        // For full cache clearing, would need to track all cache keys manually
        this.logger.debug('Clearing all Nova Poshta cache');
        this.logger.warn(
          'Full cache clearing not implemented - clear specific cache keys manually',
        );
      }
      this.logger.debug('Cache cleared successfully');
    } catch (error) {
      this.logger.warn(`Failed to clear cache: ${error.message}`);
    }
  }
}
