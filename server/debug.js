console.log('1: Starting debug');

console.log('2: Testing dotenv');
require('dotenv').config();
console.log('3: dotenv OK');

console.log('4: Testing express');
const express = require('express');
console.log('5: express OK');

console.log('6: Testing logger import');
const logger = require('./src/utils/logger');
console.log('7: logger OK');

console.log('8: All imports successful - exiting');
process.exit(0);
