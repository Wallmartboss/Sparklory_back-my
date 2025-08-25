const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/v1';

async function testOptimizedEndpoints() {
  console.log('🚀 Testing Optimized Product Endpoints\n');

  try {
    // Test 1: Basic optimized products endpoint
    console.log('1. Testing basic optimized products endpoint...');
    const startTime = Date.now();
    const response1 = await axios.get(`${BASE_URL}/optimized-products`);
    const endTime = Date.now();

    console.log(`✅ Response time: ${endTime - startTime}ms`);
    console.log(`📊 Cache hit: ${response1.data.cacheHit}`);
    console.log(`📦 Products found: ${response1.data.total}`);
    console.log(`⏱️ Execution time: ${response1.data.executionTime}ms\n`);

    // Test 2: Optimized products with filters
    console.log('2. Testing optimized products with filters...');
    const response2 = await axios.get(`${BASE_URL}/optimized-products`, {
      params: {
        category: 'earrings',
        limit: 5,
        page: 1,
        useCache: true,
        sort: 'price_asc',
      },
    });

    console.log(`✅ Cache hit: ${response2.data.cacheHit}`);
    console.log(`📦 Products found: ${response2.data.total}`);
    console.log(`⏱️ Execution time: ${response2.data.executionTime}ms\n`);

    // Test 3: Search products
    console.log('3. Testing search products...');
    const response3 = await axios.get(`${BASE_URL}/optimized-products/search`, {
      params: {
        q: 'gold',
        limit: 3,
        useCache: true,
      },
    });

    console.log(`✅ Cache hit: ${response3.data.cacheHit}`);
    console.log(`📦 Products found: ${response3.data.total}`);
    console.log(`⏱️ Execution time: ${response3.data.executionTime}ms\n`);

    // Test 4: Products with discount filter
    console.log('4. Testing products with discount filter...');
    const response4 = await axios.get(`${BASE_URL}/optimized-products`, {
      params: {
        hasDiscount: true,
        limit: 5,
        useCache: true,
      },
    });

    console.log(`✅ Cache hit: ${response4.data.cacheHit}`);
    console.log(`📦 Products found: ${response4.data.total}`);
    console.log(`⏱️ Execution time: ${response4.data.executionTime}ms\n`);

    // Test 5: Test endpoint
    console.log('5. Testing simple test endpoint...');
    const response8 = await axios.get(`${BASE_URL}/optimized-products/test`);

    console.log(`✅ Message: ${response8.data.message}`);
    console.log(`📅 Timestamp: ${response8.data.timestamp}`);
    console.log(`🔧 Features: ${response8.data.features.join(', ')}\n`);

    console.log('🎉 All tests completed successfully!');
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);

    if (error.response?.status === 404) {
      console.log(
        '\n💡 Make sure the server is running and the endpoints are available.',
      );
      console.log('   Try running: npm run start:dev');
    }
  }
}

// Run the tests
testOptimizedEndpoints();
