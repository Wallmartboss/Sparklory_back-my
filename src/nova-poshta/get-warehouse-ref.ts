/**
 * Utility script to get warehouse reference by warehouse index
 * Usage: npm run get-warehouse-ref <cityRef> <warehouseIndex>
 * Example: npm run get-warehouse-ref 8d5a980d-391c-11dd-90d9-001a92567626 1
 */

import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

async function getWarehouseRef(cityRef: string, warehouseIndex: string) {
  const configService = new ConfigService();
  const httpService = new HttpService();

  const apiUrl = configService.get<string>('NOVA_POSHTA_API_URL');
  const apiKey = configService.get<string>('NOVA_POSHTA_API_KEY');

  if (!apiUrl || !apiKey) {
    console.error('Nova Poshta API credentials are not configured');
    process.exit(1);
  }

  try {
    console.log(
      `Searching for warehouse with index "${warehouseIndex}" in city "${cityRef}"...`,
    );

    const body = {
      apiKey: apiKey,
      modelName: 'Address',
      calledMethod: 'getWarehouses',
      methodProperties: {
        CityRef: cityRef,
      },
    };

    const { data } = await firstValueFrom(
      httpService.post(apiUrl, body, {
        timeout: 10000,
      }),
    );

    if (!data.success) {
      console.error('API Error:', data.errors);
      process.exit(1);
    }

    const warehouses = data.data;
    console.log(`Found ${warehouses.length} warehouses in the city`);

    // Search for warehouse by index
    const warehouse = warehouses.find(
      (w: any) =>
        w.WarehouseIndex === warehouseIndex ||
        w.Number === warehouseIndex ||
        w.Ref === warehouseIndex,
    );

    if (warehouse) {
      console.log('\n✅ Found warehouse:');
      console.log(`   Ref: ${warehouse.Ref}`);
      console.log(`   Number: ${warehouse.Number}`);
      console.log(`   WarehouseIndex: ${warehouse.WarehouseIndex}`);
      console.log(`   Description: ${warehouse.Description}`);
      console.log(`   Category: ${warehouse.CategoryOfWarehouse}`);
      console.log(`   Address: ${warehouse.ShortAddress}`);

      console.log('\n📋 For .env file:');
      console.log(`NOVA_POSHTA_WAREHOUSE_REF=${warehouse.Ref}`);
    } else {
      console.log('\n❌ Warehouse not found');
      console.log('Available warehouses with similar indexes:');

      // Show first 10 warehouses for reference
      warehouses.slice(0, 10).forEach((w: any) => {
        console.log(`   ${w.WarehouseIndex} (${w.Number}) - ${w.Description}`);
      });
    }
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Get command line arguments
const args = process.argv.slice(2);
if (args.length !== 2) {
  console.log('Usage: npm run get-warehouse-ref <cityRef> <warehouseIndex>');
  console.log(
    'Example: npm run get-warehouse-ref 8d5a980d-391c-11dd-90d9-001a92567626 1',
  );
  process.exit(1);
}

const [cityRef, warehouseIndex] = args;
getWarehouseRef(cityRef, warehouseIndex);
