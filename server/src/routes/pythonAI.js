const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const router = express.Router();
const fs = require('fs');
const http = require('http');
const https = require('https');
const { URL } = require('url');

// HTTP request helper function for Python API calls
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
      timeout: options.timeout || 10000
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

// Simple fetch polyfill using the HTTP helper
const fetch = async (url, options = {}) => {
  return makeHttpRequest(url, options);
};

// Python AI System Integration
class PythonAIService {
  constructor() {
    this.pythonPath = path.join(__dirname, '../../../farm_ai_crew/src');
    this.isRunning = false;
  }

  async runPythonAI(operation, inputs = {}) {
    return new Promise((resolve, reject) => {
      if (this.isRunning) {
        return reject(new Error('Python AI system is already running'));
      }

      this.isRunning = true;

      // Prefer project venv python if available
      const projectRoot = path.join(__dirname, '../../../');
      const venvPython = process.platform === 'win32'
        ? path.join(projectRoot, 'farm_ai_crew', '.venv', 'Scripts', 'python.exe')
        : path.join(projectRoot, 'farm_ai_crew', '.venv', 'bin', 'python');

      let pythonCmd;
      let pythonArgs;
      if (fs.existsSync(venvPython)) {
        pythonCmd = venvPython;
        pythonArgs = ['-m', 'farm_ai_crew.main', operation];
      } else {
        pythonCmd = process.platform === 'win32' ? 'py' : 'python';
        pythonArgs = process.platform === 'win32'
          ? ['-3', '-m', 'farm_ai_crew.main', operation]
          : ['-m', 'farm_ai_crew.main', operation];
      }

      const pythonProcess = spawn(
        pythonCmd,
        pythonArgs,
        {
          cwd: this.pythonPath,
          stdio: ['pipe', 'pipe', 'pipe'],
          env: { ...process.env, PYTHONPATH: this.pythonPath }
        }
      );

      let output = '';
      let errorOutput = '';

      pythonProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      pythonProcess.on('close', (code) => {
        this.isRunning = false;

        if (code === 0) {
          resolve({
            success: true,
            output: output,
            operation: operation,
            timestamp: new Date().toISOString()
          });
        } else {
          reject(new Error(`Python AI process exited with code ${code}: ${errorOutput}`));
        }
      });

      pythonProcess.on('error', (error) => {
        this.isRunning = false;
        reject(new Error(`Failed to start Python AI process: ${error.message}`));
      });

      // Set timeout for long-running operations
      setTimeout(() => {
        if (this.isRunning) {
          pythonProcess.kill();
          this.isRunning = false;
          reject(new Error('Python AI operation timed out'));
        }
      }, 300000); // 5 minutes timeout
    });
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      pythonPath: this.pythonPath,
      timestamp: new Date().toISOString()
    };
  }
}

const pythonAIService = new PythonAIService();

// Routes
router.get('/status', async (req, res) => {
  try {
    // Check if our FastAPI Python server is running on port 8000
    const pythonApiUrl = process.env.PYTHON_AI_URL || 'http://localhost:8000';
    
    try {
      const response = await fetch(`${pythonApiUrl}/health`, { 
        signal: AbortSignal.timeout(5000) 
      });
      
      if (response.ok) {
        const healthData = await response.json();
        res.json({
          isRunning: false, // Not running a specific operation
          pythonPath: pythonApiUrl,
          timestamp: new Date().toISOString(),
          status: 'online',
          service: healthData.service || 'Farm AI Crew API',
          version: healthData.version || '1.0.0'
        });
      } else {
        throw new Error('Health check failed');
      }
    } catch (fetchError) {
      // Python FastAPI server is not running
      res.json({
        isRunning: false,
        pythonPath: pythonApiUrl,
        timestamp: new Date().toISOString(),
        status: 'offline',
        error: 'Python FastAPI server not running on port 8000'
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/daily-operations', async (req, res) => {
  try {
    const pythonApiUrl = process.env.PYTHON_AI_URL || 'http://localhost:8000';
    const response = await fetch(`${pythonApiUrl}/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        task_id: `daily-${Date.now()}`,
        agent_id: 'farm-manager',
        task_type: 'daily_operations',
        payload: req.body,
        trace_id: `trace-${Date.now()}`
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      res.json({
        status: result.success ? 'success' : 'error',
        output: result.result?.output || JSON.stringify(result.result, null, 2)
      });
    } else {
      const errorText = await response.text();
      res.status(500).json({ error: `Python API error: ${errorText}` });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/crisis-response', async (req, res) => {
  try {
    const { emergencyType = 'weather_alert' } = req.body;
    const result = await pythonAIService.runPythonAI('crisis', { emergencyType });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/content-creation', async (req, res) => {
  try {
    const result = await pythonAIService.runPythonAI('content', req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/strategic-planning', async (req, res) => {
  try {
    const result = await pythonAIService.runPythonAI('strategic', req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/full-crew', async (req, res) => {
  try {
    const result = await pythonAIService.runPythonAI('full', req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/test', async (req, res) => {
  try {
    const pythonApiUrl = process.env.PYTHON_AI_URL || 'http://localhost:8000';
    const response = await fetch(`${pythonApiUrl}/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        task_id: `test-${Date.now()}`,
        agent_id: 'farm-manager',
        task_type: 'crop_analysis',
        payload: { ...req.body, test_mode: true },
        trace_id: `test-trace-${Date.now()}`
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      res.json({
        status: result.success ? 'success' : 'error',
        output: result.result?.output || JSON.stringify(result.result, null, 2)
      });
    } else {
      const errorText = await response.text();
      res.status(500).json({ error: `Python API error: ${errorText}` });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
