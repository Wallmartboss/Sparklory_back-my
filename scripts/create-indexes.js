const mongoose = require('mongoose');

// MongoDB connection string - use the same as the application
const MONGODB_URI =
  process.env.DB_CONNECTION_STRING || 'mongodb://localhost:27017/sparklory';

async function createIndexes() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB successfully');

    const db = mongoose.connection.db;
    const collection = db.collection('products');

    console.log('Creating indexes for products collection...');

    // Single field indexes
    const singleIndexes = [
      { category: 1 },
      { subcategory: 1 },
      { 'variants.material': 1 },
      { 'variants.insert': 1 },
      { 'variants.inStock': 1 },
      { discount: 1 },
      { action: 1 },
      { gender: 1 },
      { prod_collection: 1 },
    ];

    // Compound indexes
    const compoundIndexes = [
      { category: 1, subcategory: 1 },
      { category: 1, 'variants.material': 1 },
      { category: 1, discount: 1 },
      { 'variants.inStock': 1, discount: 1 },
    ];

    // Text index for search
    const textIndex = {
      name: 'text',
      description: 'text',
      category: 'text',
      subcategory: 'text',
    };

    const textIndexOptions = {
      weights: {
        name: 10,
        description: 5,
        category: 3,
        subcategory: 3,
      },
    };

    // Create single field indexes
    for (const index of singleIndexes) {
      try {
        await collection.createIndex(index);
        console.log(`✓ Created index: ${JSON.stringify(index)}`);
      } catch (error) {
        if (error.code === 85) {
          console.log(`⚠ Index already exists: ${JSON.stringify(index)}`);
        } else {
          console.error(
            `✗ Failed to create index ${JSON.stringify(index)}:`,
            error.message,
          );
        }
      }
    }

    // Create compound indexes
    for (const index of compoundIndexes) {
      try {
        await collection.createIndex(index);
        console.log(`✓ Created compound index: ${JSON.stringify(index)}`);
      } catch (error) {
        if (error.code === 85) {
          console.log(
            `⚠ Compound index already exists: ${JSON.stringify(index)}`,
          );
        } else {
          console.error(
            `✗ Failed to create compound index ${JSON.stringify(index)}:`,
            error.message,
          );
        }
      }
    }

    // Create text index
    try {
      await collection.createIndex(textIndex, textIndexOptions);
      console.log('✓ Created text index for search functionality');
    } catch (error) {
      if (error.code === 85) {
        console.log('⚠ Text index already exists');
      } else {
        console.error('✗ Failed to create text index:', error.message);
      }
    }

    // List all indexes
    console.log('\n📋 Current indexes:');
    const indexes = await collection.indexes();
    indexes.forEach((index, i) => {
      console.log(`${i + 1}. ${index.name}: ${JSON.stringify(index.key)}`);
    });

    console.log('\n✅ Index creation completed successfully!');
  } catch (error) {
    console.error('❌ Error creating indexes:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
if (require.main === module) {
  createIndexes();
}

module.exports = { createIndexes };
