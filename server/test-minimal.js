const express = require('express');
const app = express();
const PORT = 3001;

console.log('Starting minimal test server...');

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`✅ Minimal server running on port ${PORT}`);
});

console.log('Server setup complete');
