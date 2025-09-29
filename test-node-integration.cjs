const http = require('http');

function makeRequest(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });
    
    req.on('error', (err) => {
      reject(err);
    });
    
    if (data) {
      req.write(data);
    }
    req.end();
  });
}

async function testIntegration() {
  console.log('Testing Node.js to Python AI integration...');
  
  try {
    // Test submitting a task through Node.js Enhanced Agent Service
    const taskData = JSON.stringify({
      type: 'crop_analysis',
      payload: {
        farm_location: 'Integration Test Farm',
        test_mode: true
      },
      priority: 1,
      requiredCapability: 'crop_analysis'
    });
    
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/ai-agents/tasks',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(taskData)
      }
    };
    
    console.log('Submitting task to Node.js Enhanced Agent Service...');
    const response = await makeRequest(options, taskData);
    
    if (response.status === 200 || response.status === 201) {
      console.log('SUCCESS: Task submitted successfully');
      console.log('Task ID:', response.data.taskId);
      
      // Wait a moment for task to process
      console.log('Waiting for task to process...');
      await new Promise(resolve => setTimeout(resolve, 8000));
      
      // Check task status
      const statusOptions = {
        hostname: 'localhost',
        port: 3001,
        path: `/api/ai-agents/tasks/${response.data.taskId}/status`,
        method: 'GET'
      };
      
      const statusResponse = await makeRequest(statusOptions);
      
      if (statusResponse.status === 200 && statusResponse.data) {
        console.log('SUCCESS: Got task status');
        console.log('Status:', statusResponse.data.status);
        console.log('Success:', statusResponse.data.result?.success);
        
        if (statusResponse.data.result?.pythonResponse) {
          console.log('SUCCESS: Python API was called successfully!');
          console.log('Python result type:', statusResponse.data.result.pythonResponse.result?.crew_type);
        } else if (statusResponse.data.result?.fallback) {
          console.log('WARNING: Used simulation fallback (Python service not connected)');
        }
        
        console.log('\n=== INTEGRATION TEST RESULTS ===');
        if (statusResponse.data.result?.pythonResponse) {
          console.log('✅ SUCCESS: Node.js → Python integration is working!');
          console.log('✅ Enhanced Agent Service successfully calls Python FastAPI');
          console.log('✅ Real AI task execution instead of simulation');
        } else {
          console.log('⚠️  PARTIAL: Integration layer works but using fallback');
          console.log('   Check that Python service is running on port 8000');
        }
      } else {
        console.log('ERROR: Could not get task status');
        console.log('Response:', statusResponse);
      }
      
    } else {
      console.log('ERROR: Failed to submit task');
      console.log('Status:', response.status);
      console.log('Response:', response.data);
    }
    
  } catch (error) {
    console.log('ERROR: Integration test failed');
    console.log('Error:', error.message);
  }
}

if (require.main === module) {
  testIntegration();
}
