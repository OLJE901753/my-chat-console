const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const router = express.Router();

// Python AI System Integration
class PythonAIService {
  constructor() {
    this.pythonPath = path.join(__dirname, '../../../farm_ai_crew');
    this.isRunning = false;
  }

  async runPythonAI(operation, inputs = {}) {
    return new Promise((resolve, reject) => {
      if (this.isRunning) {
        return reject(new Error('Python AI system is already running'));
      }

      this.isRunning = true;
      
      const pythonProcess = spawn('python', [
        '-m', 'farm_ai_crew.main',
        operation
      ], {
        cwd: this.pythonPath,
        stdio: ['pipe', 'pipe', 'pipe']
      });

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
router.get('/status', (req, res) => {
  try {
    const status = pythonAIService.getStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/daily-operations', async (req, res) => {
  try {
    const result = await pythonAIService.runPythonAI('daily', req.body);
    res.json(result);
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
    const result = await pythonAIService.runPythonAI('test', req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
