try {
  console.log('Testing environment config...');
  require('dotenv').config();
  const envConfig = require('./src/config/environment');
  console.log('Environment config loaded successfully');
  console.log('Config:', envConfig.getConfig());
} catch (error) {
  console.error('Error loading environment config:', error.message);
  console.error('Stack:', error.stack);
}