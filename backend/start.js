#!/usr/bin/env node

const mongoose = require('mongoose');
require('dotenv').config();

// Simple startup script to test database connection
const testConnection = async () => {
  try {
    console.log('🔌 Testing database connection...');
    
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/skillswap', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    
    // Test basic operations
    const collections = await conn.connection.db.listCollections().toArray();
    console.log(`📁 Collections: ${collections.length}`);
    
    await mongoose.disconnect();
    console.log('🔌 Database connection closed');
    
    console.log('\n🚀 Backend is ready to start!');
    console.log('Run: npm run dev');
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.log('\n💡 Make sure MongoDB is running:');
    console.log('   - Local: mongod');
    console.log('   - Docker: docker run -d -p 27017:27017 --name mongodb mongo:latest');
    process.exit(1);
  }
};

testConnection();
