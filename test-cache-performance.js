const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/v1';

async function testCachePerformance() {
  console.log('🔥 Testing Cache Performance\n');

  try {
    // Test 1: First request (should be cache miss)
    console.log('1. First request (cache miss expected)...');
    const start1 = Date.now();
    const response1 = await axios.get(`${BASE_URL}/optimized-products`, {
      params: { limit: 5, useCache: true },
    });
    const time1 = Date.now() - start1;

    console.log(`⏱️ Time: ${time1}ms`);
    console.log(`📊 Cache hit: ${response1.data.cacheHit}`);
    console.log(`📦 Products: ${response1.data.total}\n`);

    // Test 2: Second request (should be cache hit)
    console.log('2. Second request (cache hit expected)...');
    const start2 = Date.now();
    const response2 = await axios.get(`${BASE_URL}/optimized-products`, {
      params: { limit: 5, useCache: true },
    });
    const time2 = Date.now() - start2;

    console.log(`⏱️ Time: ${time2}ms`);
    console.log(`📊 Cache hit: ${response2.data.cacheHit}`);
    console.log(`📦 Products: ${response2.data.total}\n`);

    // Test 3: Different query (should be cache miss)
    console.log('3. Different query (cache miss expected)...');
    const start3 = Date.now();
    const response3 = await axios.get(`${BASE_URL}/optimized-products`, {
      params: { limit: 10, category: 'earrings', useCache: true },
    });
    const time3 = Date.now() - start3;

    console.log(`⏱️ Time: ${time3}ms`);
    console.log(`📊 Cache hit: ${response3.data.cacheHit}`);
    console.log(`📦 Products: ${response3.data.total}\n`);

    // Test 4: Same different query (should be cache hit)
    console.log('4. Same different query (cache hit expected)...');
    const start4 = Date.now();
    const response4 = await axios.get(`${BASE_URL}/optimized-products`, {
      params: { limit: 10, category: 'earrings', useCache: true },
    });
    const time4 = Date.now() - start4;

    console.log(`⏱️ Time: ${time4}ms`);
    console.log(`📊 Cache hit: ${response4.data.cacheHit}`);
    console.log(`📦 Products: ${response4.data.total}\n`);

    // Performance analysis
    console.log('📈 Performance Analysis:');
    console.log(`First request: ${time1}ms`);
    console.log(`Second request: ${time2}ms`);
    console.log(
      `Improvement: ${Math.round(((time1 - time2) / time1) * 100)}% faster`,
    );

    if (time2 < time1) {
      console.log('✅ Cache is working! Second request was faster.');
    } else {
      console.log('⚠️ Cache might not be working optimally.');
    }

    console.log('\n🎉 Cache performance test completed!');
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testCachePerformance();
