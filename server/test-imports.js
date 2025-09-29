console.log('Testing imports...');

try {
  console.log('1. Testing Supabase service...');
  const SupabaseService = require('./src/services/supabaseService');
  console.log('✅ Supabase service OK');
} catch (e) {
  console.error('❌ Supabase service error:', e.message);
}

try {
  console.log('2. Testing SSE service...');
  const SSEService = require('./src/services/sseService');
  console.log('✅ SSE service OK');
} catch (e) {
  console.error('❌ SSE service error:', e.message);
}

try {
  console.log('3. Testing Enhanced AI Agent routes...');
  const EnhancedAIAgentRoutes = require('./src/routes/enhancedAiAgents');
  console.log('✅ Enhanced AI Agent routes OK');
} catch (e) {
  console.error('❌ Enhanced AI Agent routes error:', e.message);
}

try {
  console.log('4. Testing telemetry routes...');
  const telemetryRoutes = require('./src/routes/telemetry');
  console.log('✅ Telemetry routes OK');
} catch (e) {
  console.error('❌ Telemetry routes error:', e.message);
}

try {
  console.log('5. Testing SSE routes...');
  const { router: sseRoutes } = require('./src/routes/sse');
  console.log('✅ SSE routes OK');
} catch (e) {
  console.error('❌ SSE routes error:', e.message);
}

console.log('Import test completed.');