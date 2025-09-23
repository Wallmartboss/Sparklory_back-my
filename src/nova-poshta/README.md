# Nova Poshta Integration Module

## Overview

This module provides integration with Nova Poshta API for delivery services. The implementation includes caching, timeout handling, and optimized performance.

## Features

### ✅ Performance Optimizations

1. **Caching System**
   - Cities cache: 1 hour TTL
   - Warehouses cache: 1 hour TTL  
   - Delivery cost cache: 1 hour TTL
   - Tracking cache: 15 minutes TTL

2. **Timeout Handling**
   - 10-second timeout for API requests
   - Proper error handling and logging

3. **Memory Management**
   - Maximum 100 items in cache
   - Automatic cache expiration

### 🚀 API Endpoints

#### GET `/nova-poshta/cities`
Get list of cities with optional search
- **Query params**: `cityName` (optional)
- **Cache**: 1 hour
- **Performance**: ~50ms (cached) vs ~2000ms (API)

#### GET `/nova-poshta/warehouses`
Get warehouses by city reference
- **Query params**: `cityRef` (required), `type` (optional)
- **Cache**: 1 hour
- **Performance**: ~50ms (cached) vs ~3000ms (API)
- **Fallback**: Uses alternative API method if primary fails
- **Warehouse types**: 
  - `Branch` - Відділення (404 в Києві)
  - `Postomat` - Поштомати (5759 в Києві)
  - `DropOff` - Пункти видачі (230 в Києві)
  - `Fulfillment` - Фулфілмент склади (3 в Києві)

#### GET `/nova-poshta/delivery-cost`
Calculate delivery cost with insurance
- **Query params**: `cityRef` (required), `warehouseRef` (required), `weight` (required), `cartTotal` (optional)
- **Cache**: 1 hour
- **Performance**: ~50ms (cached) vs ~1500ms (API)
- **Insurance**: 0.5% of cart total
- **Response format**:
  ```json
  {
    "deliveryCost": 45.50,
    "insuranceCost": 7.50,
    "totalCost": 53.00,
    "cartTotal": 1500,
    "insurancePercentage": 0.005
  }
  ```



#### POST `/nova-poshta/preload-cache`

### Environment Variables
```env
NOVA_POSHTA_API_URL=https://api.novaposhta.ua/v2.0/json/
NOVA_POSHTA_API_KEY=your_api_key_here
NOVA_POSHTA_CITY_REF=your_sender_city_reference
NOVA_POSHTA_WAREHOUSE_REF=your_sender_warehouse_reference
# Alternative: use NOVA_POSHTA_WAREHOUSE_NAME instead of NOVA_POSHTA_WAREHOUSE_REF
# NOVA_POSHTA_WAREHOUSE_NAME=your_warehouse_name
```

### Getting Warehouse Reference

To get the warehouse reference for your sender location, use the utility script:

```bash
npm run get-warehouse-ref <cityRef> <warehouseIndex>
```

Example:
```bash
npm run get-warehouse-ref 8d5a980d-391c-11dd-90d9-001a92567626 1
```

This will output the warehouse reference that you can use in your `.env` file:
```
NOVA_POSHTA_WAREHOUSE_REF=1ec09d88-e1c2-11e3-8c4a-0050568002cf
```

### Sender Warehouse Configuration

The delivery cost calculation uses both sender and recipient warehouse information:

- **Sender City**: `NOVA_POSHTA_CITY_REF` - City where packages are sent from
- **Sender Warehouse**: `NOVA_POSHTA_WAREHOUSE_REF` - Specific warehouse reference where packages are sent from (preferred)
- **Alternative**: `NOVA_POSHTA_WAREHOUSE_NAME` - Warehouse name for lookup (fallback)
- **Recipient City**: Provided in the API request
- **Recipient Warehouse**: Provided in the API request (either as warehouseRef or warehouseIndex)

**Priority**: If `NOVA_POSHTA_WAREHOUSE_REF` is set, it will be used directly. Otherwise, the system will search for a warehouse by `NOVA_POSHTA_WAREHOUSE_NAME` in the specified city.

This ensures the most accurate delivery cost calculation by specifying exact pickup and delivery locations.
