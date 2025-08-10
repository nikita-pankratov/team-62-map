#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Team 62 Map - Environment Setup\n');

// Check if .env already exists
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  console.log('⚠️  .env file already exists!');
  console.log('   If you want to update your API keys, edit the .env file directly.\n');
  process.exit(0);
}

// Check if env.example exists
const examplePath = path.join(__dirname, 'env.example');
if (!fs.existsSync(examplePath)) {
  console.log('❌ env.example file not found!');
  console.log('   Please make sure you have the env.example file in the project root.\n');
  process.exit(1);
}

// Copy env.example to .env
try {
  fs.copyFileSync(examplePath, envPath);
  console.log('✅ Created .env file from env.example');
  console.log('📝 Please edit the .env file with your actual API keys:\n');
  console.log('   VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here');
  console.log('   VITE_CHATGPT_API_KEY=your_chatgpt_api_key_here\n');
  console.log('🔑 Get your API keys from:');
  console.log('   Google Maps: https://console.cloud.google.com/apis/credentials');
  console.log('   ChatGPT: https://platform.openai.com/api-keys\n');
  console.log('🚀 After adding your API keys, run: npm run dev');
} catch (error) {
  console.log('❌ Failed to create .env file:', error.message);
  process.exit(1);
}
