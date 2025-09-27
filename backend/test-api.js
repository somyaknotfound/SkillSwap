#!/usr/bin/env node

const axios = require('axios');
require('dotenv').config();

const API_BASE = process.env.API_BASE || 'http://localhost:5000/api';

const testAPI = async () => {
  console.log('🧪 Testing SkillSwap API...\n');
  
  try {
    // Test health endpoint
    console.log('1. Testing health endpoint...');
    const healthResponse = await axios.get(`${API_BASE}/health`);
    console.log('✅ Health check passed:', healthResponse.data.message);
    
    // Test marketplace stats
    console.log('\n2. Testing marketplace stats...');
    const statsResponse = await axios.get(`${API_BASE}/marketplace/stats`);
    console.log('✅ Marketplace stats:', statsResponse.data.stats);
    
    // Test categories
    console.log('\n3. Testing categories...');
    const categoriesResponse = await axios.get(`${API_BASE}/marketplace/categories`);
    console.log('✅ Categories loaded:', categoriesResponse.data.categories.length);
    
    // Test courses endpoint
    console.log('\n4. Testing courses endpoint...');
    const coursesResponse = await axios.get(`${API_BASE}/courses?limit=5`);
    console.log('✅ Courses endpoint working:', coursesResponse.data.count, 'courses found');
    
    // Test skills endpoint
    console.log('\n5. Testing skills endpoint...');
    const skillsResponse = await axios.get(`${API_BASE}/skills?limit=5`);
    console.log('✅ Skills endpoint working:', skillsResponse.data.count, 'skills found');
    
    console.log('\n🎉 All API tests passed! Backend is working correctly.');
    
  } catch (error) {
    console.error('❌ API test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    process.exit(1);
  }
};

// Only run if this file is executed directly
if (require.main === module) {
  testAPI();
}

module.exports = testAPI;
