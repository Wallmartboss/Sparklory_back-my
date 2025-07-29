# Nova Poshta Delivery Cost Example Usage

## Delivery Cost Calculation with Insurance

The delivery cost endpoint now includes insurance calculation (0.5% of cart total) and uses environment variables for sender location.

### Warehouse Reference vs Warehouse Index

- **WarehouseRef**: Unique identifier (GUID) for the warehouse
- **WarehouseIndex**: Human-readable number/name of the warehouse

You can use either:
1. **Direct warehouse reference** (endpoint: `/delivery-cost`)
2. **Warehouse index** (endpoint: `/delivery-cost-by-index`) - the system will automatically find the corresponding warehouse reference

### Request Examples

#### Using Warehouse Reference
```bash
GET /api/v1/nova-poshta/delivery-cost?cityRef=8d5a980d-391c-11dd-90d9-001a92567626&warehouseRef=7b422fc3-e1b8-11e3-8c4a-0050568002cf&weight=2.5&cartTotal=1500
```

#### Using Warehouse Index
```bash
GET /api/v1/nova-poshta/delivery-cost-by-index?cityRef=8d5a980d-391c-11dd-90d9-001a92567626&warehouseIndex=1&weight=2.5&cartTotal=1500
```

### Parameters

#### For `/delivery-cost` endpoint:
- `cityRef` (required): City reference ID for delivery destination
- `warehouseRef` (required): Warehouse reference ID for delivery destination  
- `weight` (required): Package weight in kg
- `cartTotal` (optional): Cart total amount for insurance calculation

#### For `/delivery-cost-by-index` endpoint:
- `cityRef` (required): City reference ID for delivery destination
- `warehouseIndex` (required): Warehouse index/number for delivery destination
- `weight` (required): Package weight in kg
- `cartTotal` (optional): Cart total amount for insurance calculation

### Response Example

```json
{
  "deliveryCost": 45.50,
  "insuranceCost": 7.50,
  "totalCost": 53.00,
  "cartTotal": 1500,
  "insurancePercentage": 0.005
}
```

### Environment Variables Required

```env
NOVA_POSHTA_API_URL=https://api.novaposhta.ua/v2.0/json/
NOVA_POSHTA_API_KEY=your_api_key_here
NOVA_POSHTA_CITY_REF=your_sender_city_reference
NOVA_POSHTA_WAREHOUSE_REF=your_sender_warehouse_reference
```

### Insurance Calculation

- Insurance cost = cartTotal × 0.005 (0.5%)
- Total delivery cost = deliveryCost + insuranceCost
- All costs are rounded to 2 decimal places

### Caching

- Results are cached for 1 hour
- Cache key includes all parameters: `delivery_cost:${cityRef}:${warehouseRef}:${weight}:${cartTotal}`
- Warehouse reference lookups are also cached: `warehouse_ref:${cityRef}:${warehouseIndex}`
- Subsequent requests with same parameters return cached results

### How WarehouseRef is Determined from WarehouseIndex

1. The system fetches all warehouses for the specified city
2. Searches for a warehouse where `WarehouseIndex` matches the provided index
3. Returns the corresponding `Ref` (warehouse reference)
4. Uses this reference in the Nova Poshta API call for accurate delivery cost calculation

### How Sender Warehouse is Used

The system also uses the sender warehouse configuration for accurate delivery cost calculation:

1. **Sender Configuration**: Uses environment variables `NOVA_POSHTA_CITY_REF` and `NOVA_POSHTA_WAREHOUSE_REF`
2. **Sender Warehouse**: Directly uses the warehouse reference from environment variables (no lookup needed)
3. **API Call**: Includes both sender and recipient warehouse information in the Nova Poshta API call:
   ```json
   {
     "CitySender": "sender_city_ref",
     "WarehouseSender": "sender_warehouse_ref",
     "CityRecipient": "recipient_city_ref", 
     "WarehouseRecipient": "recipient_warehouse_ref",
     "Weight": 2.5,
     "ServiceType": "WarehouseWarehouse",
     "Cost": 1500,
     "CargoType": "Parcel",
     "SeatsAmount": 1,
     "DateTime": "2025-01-29",
     "PaymentMethod": "Cash",
     "PayerType": "Sender",
     "DeliveryType": "WarehouseWarehouse"
   }
   ```

This ensures the most accurate delivery cost calculation by specifying exact pickup and delivery locations. 