const express = require('express');
const router = express.Router();
const http = require('http');
const https = require('https');
const { URL } = require('url');
const querystring = require('querystring');

// Netatmo configuration
const NETATMO_CONFIG = {
  apiUrl: 'https://api.netatmo.com',
  deviceId: '70:ee:50:29:0d:66',
  clientId: process.env.NETATMO_CLIENT_ID,
  clientSecret: process.env.NETATMO_CLIENT_SECRET,
  username: process.env.NETATMO_USERNAME,
  password: process.env.NETATMO_PASSWORD
};

// Token storage
let accessToken = null;
let tokenExpiry = 0;

// HTTP request helper
function makeHttpRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const httpModule = isHttps ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {},
      timeout: options.timeout || 30000
    };
    
    const req = httpModule.request(requestOptions, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        resolve({
          ok: res.statusCode >= 200 && res.statusCode < 300,
          status: res.statusCode,
          text: () => Promise.resolve(body),
          json: () => Promise.resolve(JSON.parse(body))
        });
      });
    });
    
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

/**
 * Check if we have valid credentials
 */
function hasCredentials() {
  return !!(NETATMO_CONFIG.clientId && NETATMO_CONFIG.clientSecret && 
           NETATMO_CONFIG.username && NETATMO_CONFIG.password);
}

/**
 * Check if access token is valid
 */
function isTokenValid() {
  return !!(accessToken && Date.now() < tokenExpiry);
}

/**
 * Authenticate with Netatmo API
 */
async function authenticate() {
  if (!hasCredentials()) {
    throw new Error('Netatmo credentials not configured');
  }

  const authData = querystring.stringify({
    grant_type: 'password',
    client_id: NETATMO_CONFIG.clientId,
    client_secret: NETATMO_CONFIG.clientSecret,
    username: NETATMO_CONFIG.username,
    password: NETATMO_CONFIG.password,
    scope: 'read_station'
  });

  const response = await makeHttpRequest(`${NETATMO_CONFIG.apiUrl}/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(authData)
    },
    body: authData
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Netatmo authentication failed: ${response.status} - ${errorText}`);
  }

  const authResponse = await response.json();
  accessToken = authResponse.access_token;
  tokenExpiry = Date.now() + (authResponse.expires_in * 1000) - 60000; // Refresh 1 min early
}

/**
 * Ensure we have a valid access token
 */
async function ensureAuthenticated() {
  if (!isTokenValid()) {
    await authenticate();
  }
}

// Routes
router.get('/status', (req, res) => {
  res.json({
    configured: hasCredentials(),
    authenticated: isTokenValid(),
    deviceId: NETATMO_CONFIG.deviceId,
    lastTokenUpdate: tokenExpiry ? new Date(tokenExpiry + 60000).toISOString() : null
  });
});

router.get('/weather', async (req, res) => {
  try {
    if (!hasCredentials()) {
      return res.status(400).json({
        error: 'Netatmo credentials not configured',
        configured: false
      });
    }

    await ensureAuthenticated();

    const response = await makeHttpRequest(
      `${NETATMO_CONFIG.apiUrl}/api/getstationsdata?device_id=${NETATMO_CONFIG.deviceId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Netatmo API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.body?.devices || data.body.devices.length === 0) {
      throw new Error('No weather station data found');
    }

    const device = data.body.devices[0];
    const mainModule = device.dashboard_data; // Indoor module
    
    // Find specific modules by type
    const outdoorModule = device.modules?.find(module => 
      module.type === 'NAModule1' // Outdoor temperature/humidity
    )?.dashboard_data;
    
    const windModule = device.modules?.find(module => 
      module.type === 'NAModule2' // Wind gauge
    )?.dashboard_data;
    
    const rainModule = device.modules?.find(module => 
      module.type === 'NAModule3' // Rain gauge
    )?.dashboard_data;

    const weatherData = {
      // Use outdoor temperature if available, fallback to indoor
      temperature: outdoorModule?.Temperature || mainModule?.Temperature || 0,
      humidity: outdoorModule?.Humidity || mainModule?.Humidity || 0,
      // Wind data from wind module
      windSpeed: windModule?.WindStrength || 0, // Already in km/h from Netatmo
      windDirection: windModule?.WindAngle || 0,
      gustSpeed: windModule?.GustStrength || 0,
      // Indoor air quality from main module
      pressure: mainModule?.Pressure || 0,
      co2: mainModule?.CO2 || 0,
      noise: mainModule?.Noise || 0,
      // Rain data
      rain: rainModule?.Rain || 0,
      rainToday: rainModule?.sum_rain_24 || 0,
      // Metadata
      timestamp: new Date((outdoorModule?.time_utc || mainModule?.time_utc) * 1000).toISOString(),
      stationName: device.station_name || 'Nessa Weather Station',
      location: {
        city: device.place?.city || 'Unknown',
        country: device.place?.country || 'NO',
        altitude: device.place?.altitude || 0,
        coordinates: device.place?.location || [0, 0]
      }
    };

    res.json({
      success: true,
      data: weatherData,
      source: 'netatmo',
      deviceId: NETATMO_CONFIG.deviceId
    });

  } catch (error) {
    console.error('Netatmo API error:', error);
    res.status(500).json({
      error: error.message,
      configured: hasCredentials(),
      authenticated: isTokenValid()
    });
  }
});

module.exports = router;
