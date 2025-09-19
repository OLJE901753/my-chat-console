console.log('Starting simple test...');

try {
  require('dotenv').config();
  console.log('✅ dotenv loaded');
  
  const express = require('express');
  console.log('✅ express loaded');
  
  const logger = require('./src/utils/logger');
  console.log('✅ logger loaded');
  
  const app = express();
  app.get('/test', (req, res) => res.json({ status: 'ok' }));
  
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`✅ Simple server running on port ${PORT}`);
  });
  
} catch (error) {
  console.error('❌ Error:', error.message);
  console.error(error.stack);
  process.exit(1);
}
