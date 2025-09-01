const express = require('express');
const app = express();

app.get('/test', (req, res) => {
  res.json({ message: 'Server is working!' });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Simple test server running on port ${PORT}`);
});
