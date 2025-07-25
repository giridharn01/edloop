const { cloudinary } = require('./services/cloudinaryService');
require('dotenv').config();

async function testCloudinaryConnection() {
  console.log('🔧 Testing Cloudinary Connection...\n');
  
  console.log('Configuration:');
  console.log('- Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME);
  console.log('- API Key:', process.env.CLOUDINARY_API_KEY);
  console.log('- API Secret:', process.env.CLOUDINARY_API_SECRET ? '✅ Set' : '❌ Not set');
  
  // Also check Cloudinary's internal configuration
  console.log('\nCloudinary Config:');
  console.log('- Cloudinary Cloud Name:', cloudinary.config().cloud_name);
  console.log('- Cloudinary API Key:', cloudinary.config().api_key);
  console.log('- Cloudinary API Secret:', cloudinary.config().api_secret ? '✅ Set' : '❌ Not set');
  
  try {
    // Test the connection by getting account details
    const result = await cloudinary.api.ping();
    console.log('\n✅ Cloudinary Connection Successful!');
    console.log('Status:', result.status);
    
    // Get account usage info
    const usage = await cloudinary.api.usage();
    console.log('\n📊 Account Usage:');
    console.log('- Storage Used:', Math.round(usage.storage.used_bytes / 1024 / 1024), 'MB');
    console.log('- Storage Limit:', Math.round(usage.storage.limit / 1024 / 1024), 'MB');
    console.log('- Bandwidth Used:', Math.round(usage.bandwidth.used_bytes / 1024 / 1024), 'MB');
    console.log('- Bandwidth Limit:', Math.round(usage.bandwidth.limit / 1024 / 1024), 'MB');
    
    console.log('\n🎉 Cloudinary is ready to use!');
    
  } catch (error) {
    console.error('\n❌ Cloudinary Connection Failed!');
    console.error('Error:', error);
    
    if (error.message && error.message.includes('Invalid API key')) {
      console.error('\n💡 Fix: Check your CLOUDINARY_API_KEY in .env file');
    } else if (error.message && error.message.includes('Invalid API secret')) {
      console.error('\n💡 Fix: Check your CLOUDINARY_API_SECRET in .env file');
    } else if (error.message && error.message.includes('cloud_name')) {
      console.error('\n💡 Fix: Check your CLOUDINARY_CLOUD_NAME in .env file');
    } else {
      console.error('\n💡 Check all your Cloudinary credentials in .env file');
    }
  }
}

testCloudinaryConnection();
