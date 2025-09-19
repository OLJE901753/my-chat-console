const logger = require('../utils/logger');
const SupabaseService = require('./supabaseService');

/**
 * Enhanced AI Agent Service with Orchestrator Pattern
 * Implements unified schemas, heartbeat monitoring, and better coordination
 * Now with Supabase persistence!
 */
class EnhancedAIAgentService {
  constructor() {
    this.supabaseService = new SupabaseService();
    this.agents = new Map(); // AgentRegistry (cached)
    this.isInitialized = false;
    this.heartbeatInterval = null;
    this.traceIdCounter = 0;
    
    this.initialize();
  }

  async initialize() {
    if (this.isInitialized) return;
    
    console.log('🤖 Initializing Enhanced AI Agent Service with Supabase persistence...');
    
    try {
      // Load agents from database
      await this.loadAgentsFromDatabase();
      
      // Start heartbeat monitoring
      this.startHeartbeatMonitoring();
      
      this.isInitialized = true;
      console.log('✅ Enhanced AI Agent Service initialized with Supabase persistence');
    } catch (error) {
      console.error('❌ Failed to initialize Enhanced AI Agent Service:', error);
      throw error;
    }
  }

  // === Core Orchestrator Methods ===
  
  generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  generateTraceId() {
    return `trace-${Date.now()}-${++this.traceIdCounter}`;
  }

  async submitTask(taskData) {
    const taskId = this.generateId();
    const task = {
      taskId,
      type: taskData.type,
      payload: taskData.payload || {},
      priority: taskData.priority || 2,
      requiredCapability: taskData.requiredCapability || taskData.type,
      idempotencyKey: taskData.idempotencyKey,
      timeout: taskData.timeout || 30000,
      retryPolicy: taskData.retryPolicy || {
        maxRetries: 3,
        backoffMs: 1000,
        jitter: true
      },
      createdAt: new Date().toISOString(),
      scheduledAt: taskData.scheduledAt
    };

    // Persist task to database
    await this.persistTask(task);
    
    // Find available agent
    const availableAgent = this.findBestAgent(task.requiredCapability);
    if (!availableAgent) {
      throw new Error(`No agents available for capability: ${task.requiredCapability}`);
    }

    // Execute task asynchronously
    this.executeTaskWithAgent(task, availableAgent).catch(error => {
      logger.error(`Task ${taskId} execution failed:`, error);
    });
    
    return { taskId };
  }

  async getTaskStatus(taskId) {
    if (!this.supabaseService.supabase) {
      logger.warn('Supabase not configured, cannot get task status');
      return null;
    }

    try {
      const { data, error } = await this.supabaseService.supabase
        .from('orchestrator_task_runs')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        logger.error('Error fetching task status:', error);
        return null;
      }

      return this.mapTaskRunFromDb(data);
    } catch (error) {
      logger.error('Failed to get task status:', error);
      return null;
    }
  }

  async cancelTask(taskId, reason = 'Cancelled by user') {
    const task = this.tasks.get(taskId);
    if (!task) return false;

    // Find running task
    for (const [runId, run] of this.taskRuns.entries()) {
      if (run.taskId === taskId && run.status === 'running') {
        run.status = 'cancelled';
        run.completedAt = new Date().toISOString();
        run.error = {
          message: reason,
          code: 'CANCELLED',
          retryable: false
        };
        
        this.emitEvent({
          eventId: this.generateId(),
          taskId,
          runId,
          agentId: run.agentId,
          type: 'task.failed',
          payload: { reason },
          timestamp: new Date().toISOString(),
          traceId: run.traceId
        });
        
        return true;
      }
    }
    
    return false;
  }

  async getAgentMetrics(agentId) {
    if (!this.supabaseService.supabase) {
      logger.warn('Supabase not configured, returning cached metrics');
      return [];
    }

    try {
      let query = this.supabaseService.supabase
        .from('orchestrator_task_runs')
        .select(`
          agent_id,
          status,
          started_at,
          completed_at
        `);
      
      if (agentId) {
        query = query.eq('agent_id', agentId);
      }

      const { data: runs, error } = await query;
      if (error) throw error;

      // Group metrics by agent
      const agentMetrics = new Map();
      
      runs.forEach(run => {
        const agentId = run.agent_id;
        if (!agentMetrics.has(agentId)) {
          agentMetrics.set(agentId, {
            agentId,
            tasksCompleted: 0,
            tasksRunning: 0,
            tasksFailed: 0,
            totalExecutionTime: 0,
            executionCount: 0
          });
        }
        
        const metrics = agentMetrics.get(agentId);
        
        if (run.status === 'completed') {
          metrics.tasksCompleted++;
          if (run.started_at && run.completed_at) {
            const execTime = new Date(run.completed_at) - new Date(run.started_at);
            metrics.totalExecutionTime += execTime;
            metrics.executionCount++;
          }
        } else if (run.status === 'running') {
          metrics.tasksRunning++;
        } else if (run.status === 'failed') {
          metrics.tasksFailed++;
        }
      });

      // Convert to final format
      const result = Array.from(agentMetrics.values()).map(metrics => ({
        ...metrics,
        avgExecutionTime: metrics.executionCount > 0 
          ? metrics.totalExecutionTime / metrics.executionCount 
          : 0,
        successRate: (metrics.tasksCompleted + metrics.tasksFailed) > 0
          ? metrics.tasksCompleted / (metrics.tasksCompleted + metrics.tasksFailed)
          : 0,
        lastActivityAt: new Date().toISOString() // TODO: Get from heartbeats
      }));

      return result;
    } catch (error) {
      logger.error('Failed to get agent metrics:', error);
      return [];
    }
  }

  async getQueueStats() {
    if (!this.supabaseService.supabase) {
      logger.warn('Supabase not configured, returning default stats');
      return { pending: 0, running: 0, completed: 0, failed: 0, avgWaitTime: 0, avgExecutionTime: 0 };
    }

    try {
      const { data, error } = await this.supabaseService.supabase
        .rpc('get_orchestrator_queue_stats');
      
      if (error) throw error;
      
      const stats = data[0] || {};
      
      return {
        pending: parseInt(stats.pending) || 0,
        running: parseInt(stats.running) || 0,
        completed: parseInt(stats.completed) || 0,
        failed: parseInt(stats.failed) || 0,
        avgWaitTime: 500 + Math.random() * 1000, // Simulated for now
        avgExecutionTime: parseFloat(stats.avg_execution_time_ms) || 0
      };
    } catch (error) {
      logger.error('Failed to get queue stats:', error);
      return { pending: 0, running: 0, completed: 0, failed: 0, avgWaitTime: 0, avgExecutionTime: 0 };
    }
  }

  async registerAgent(agentData) {
    const agent = {
      ...agentData,
      registeredAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Cache locally
    this.agents.set(agent.agentId, agent);
    
    // Persist to database
    if (this.supabaseService.supabase) {
      try {
        const { error } = await this.supabaseService.supabase
          .from('orchestrator_agents')
          .upsert({
            agent_id: agent.agentId,
            name: agent.name,
            type: agent.type,
            capabilities: agent.capabilities,
            version: agent.version,
            status: agent.status,
            config: agent.config
          });
        
        if (error) throw error;
      } catch (error) {
        logger.error(`Failed to persist agent ${agent.agentId}:`, error);
      }
    }
    
    await this.emitEvent({
      eventId: this.generateId(),
      agentId: agent.agentId,
      type: 'agent.registered',
      payload: { agent },
      timestamp: new Date().toISOString(),
      traceId: this.generateTraceId()
    });
    
    logger.info(`✅ Agent registered: ${agent.agentId} (${agent.type})`);
  }

  async heartbeat(heartbeatData) {
    const heartbeat = {
      ...heartbeatData,
      lastSeen: new Date().toISOString()
    };
    
    // Update local cache
    const agent = this.agents.get(heartbeatData.agentId);
    if (agent) {
      agent.lastHeartbeat = heartbeat.lastSeen;
      agent.updatedAt = new Date().toISOString();
    }
    
    // Persist heartbeat to database
    if (this.supabaseService.supabase) {
      try {
        const { error } = await this.supabaseService.supabase
          .from('orchestrator_heartbeats')
          .upsert({
            agent_id: heartbeat.agentId,
            capabilities: heartbeat.capabilities,
            last_seen: heartbeat.lastSeen,
            load_percentage: (heartbeat.load || 0) * 100, // Convert 0-1 to 0-100
            version: heartbeat.version,
            status: heartbeat.status,
            metadata: heartbeat.metadata || {}
          });
        
        if (error) throw error;
      } catch (error) {
        logger.error(`Failed to persist heartbeat for ${heartbeat.agentId}:`, error);
      }
    }
    
    await this.emitEvent({
      eventId: this.generateId(),
      agentId: heartbeatData.agentId,
      type: 'agent.heartbeat',
      payload: heartbeatData,
      timestamp: new Date().toISOString(),
      traceId: this.generateTraceId()
    });
  }

  async getAvailableAgents(capability) {
    if (!this.supabaseService.supabase) {
      // Fallback to cached agents
      let agents = Array.from(this.agents.values()).filter(agent => agent.status === 'active');
      
      if (capability) {
        agents = agents.filter(agent => 
          agent.capabilities.some(cap => cap.type === capability)
        );
      }
      
      return agents;
    }

    try {
      let query = this.supabaseService.supabase
        .from('orchestrator_agents')
        .select('*')
        .eq('status', 'active');

      const { data: agents, error } = await query;
      if (error) throw error;

      let filteredAgents = agents.map(this.mapAgentFromDb);

      if (capability) {
        filteredAgents = filteredAgents.filter(agent => 
          agent.capabilities.some(cap => cap.type === capability)
        );
      }

      return filteredAgents;
    } catch (error) {
      logger.error('Failed to get available agents:', error);
      return [];
    }
  }

  // === Internal Helper Methods ===
  
  findBestAgent(capability) {
    const candidateAgents = Array.from(this.agents.values())
      .filter(agent => 
        agent.status === 'active' && 
        agent.capabilities.some(cap => cap.type === capability)
      )
      .sort((a, b) => {
        const loadA = this.heartbeats.get(a.agentId)?.load || 0;
        const loadB = this.heartbeats.get(b.agentId)?.load || 0;
        return loadA - loadB; // Pick least loaded
      });
    
    return candidateAgents[0] || null;
  }

  async executeTaskWithAgent(task, agent) {
    const traceId = this.generateTraceId();
    const runId = this.generateId();
    
    const run = {
      runId,
      taskId: task.taskId,
      agentId: agent.agentId,
      status: 'pending',
      attempt: 1,
      traceId,
      startedAt: new Date().toISOString()
    };

    // Persist initial run state
    await this.persistTaskRun(run);

    try {
      // Update status to running
      run.status = 'running';
      await this.persistTaskRun(run);
      
      await this.emitEvent({
        eventId: this.generateId(),
        taskId: task.taskId,
        runId,
        agentId: agent.agentId,
        type: 'task.started',
        payload: { task },
        timestamp: new Date().toISOString(),
        traceId
      });

      // Execute based on agent type
      const result = await this.executeAgentTask(agent, task, traceId);
      
      // Mark as completed
      run.status = 'completed';
      run.completedAt = new Date().toISOString();
      run.result = result;
      await this.persistTaskRun(run);
      
      await this.emitEvent({
        eventId: this.generateId(),
        taskId: task.taskId,
        runId,
        agentId: agent.agentId,
        type: 'task.completed',
        payload: { result },
        timestamp: new Date().toISOString(),
        traceId
      });
      
    } catch (error) {
      run.status = 'failed';
      run.completedAt = new Date().toISOString();
      run.error = {
        message: error.message,
        code: error.code || 'EXECUTION_ERROR',
        stack: error.stack,
        retryable: error.retryable !== false
      };
      await this.persistTaskRun(run);
      
      await this.emitEvent({
        eventId: this.generateId(),
        taskId: task.taskId,
        runId,
        agentId: agent.agentId,
        type: 'task.failed',
        payload: { error: run.error },
        timestamp: new Date().toISOString(),
        traceId
      });
      
      logger.error(`Task ${task.taskId} failed on agent ${agent.agentId}:`, error);
    }
  }

  async executeAgentTask(agent, task, traceId) {
    // Simulate task execution based on agent type
    const executionTime = 1000 + Math.random() * 3000;
    await new Promise(resolve => setTimeout(resolve, executionTime));
    
    // Simulate potential failure
    if (Math.random() < 0.05) { // 5% failure rate
      throw new Error(`Task failed on ${agent.agentId}`);
    }
    
    return {
      success: true,
      agentId: agent.agentId,
      taskType: task.type,
      executionTime,
      result: `Task ${task.type} completed successfully`,
      confidence: 0.85 + Math.random() * 0.15,
      timestamp: new Date().toISOString(),
      traceId
    };
  }

  startHeartbeatMonitoring() {
    this.heartbeatInterval = setInterval(() => {
      const now = Date.now();
      const staleThreshold = 90000; // 1.5 minutes
      
      for (const [agentId, heartbeat] of this.heartbeats.entries()) {
        const lastSeen = new Date(heartbeat.lastSeen).getTime();
        if (now - lastSeen > staleThreshold) {
          // Mark agent as stale
          const agent = this.agents.get(agentId);
          if (agent && agent.status === 'active') {
            agent.status = 'inactive';
            agent.updatedAt = new Date().toISOString();
            
            this.emitEvent({
              eventId: this.generateId(),
              agentId,
              type: 'agent.offline',
              payload: { reason: 'Heartbeat timeout' },
              timestamp: new Date().toISOString(),
              traceId: this.generateTraceId()
            });
            
            logger.warn(`⚠️ Agent ${agentId} marked as offline - heartbeat timeout`);
          }
        }
      }
    }, 30000); // Check every 30 seconds
  }

  async emitEvent(event) {
    // Persist event to database
    if (this.supabaseService.supabase) {
      try {
        const { error } = await this.supabaseService.supabase
          .from('orchestrator_events')
          .insert({
            event_id: event.eventId,
            task_id: event.taskId || null,
            run_id: event.runId || null,
            agent_id: event.agentId,
            type: event.type,
            payload: event.payload,
            timestamp: event.timestamp,
            trace_id: event.traceId
          });
        
        if (error) throw error;
      } catch (error) {
        logger.error(`Failed to persist event ${event.eventId}:`, error);
      }
    }
    
    logger.debug(`Event emitted: ${event.type} for agent ${event.agentId}`);
  }

  // === Default Agent Initialization ===
  
  async initializeDefaultAgents() {
    const defaultAgents = [
      {
        agentId: 'crop-health-monitor',
        name: 'Crop Health Monitor',
        type: 'production',
        capabilities: [
          { type: 'crop_analysis', version: '1.0', maxConcurrency: 2 },
          { type: 'disease_detection', version: '1.0', maxConcurrency: 3 },
          { type: 'pest_identification', version: '1.0', maxConcurrency: 2 }
        ],
        version: '1.0.0',
        status: 'active',
        config: { sensitivity: 85, updateFrequency: 60 }
      },
      {
        agentId: 'irrigation-optimizer',
        name: 'Irrigation Optimizer',
        type: 'resources',
        capabilities: [
          { type: 'irrigation_optimization', version: '1.0', maxConcurrency: 1 },
          { type: 'soil_analysis', version: '1.0', maxConcurrency: 3 },
          { type: 'water_management', version: '1.0', maxConcurrency: 2 }
        ],
        version: '1.0.0',
        status: 'active',
        config: { efficiency: 92, waterSavings: 30 }
      },
      {
        agentId: 'drone-pilot-ai',
        name: 'Drone Pilot AI',
        type: 'operations',
        capabilities: [
          { type: 'flight_planning', version: '1.0', maxConcurrency: 1 },
          { type: 'mission_execution', version: '1.0', maxConcurrency: 2 },
          { type: 'emergency_procedures', version: '1.0', maxConcurrency: 5 }
        ],
        version: '1.0.0',
        status: 'active',
        config: { maxAltitude: 120, safetyRadius: 500 }
      },
      {
        agentId: 'computer-vision',
        name: 'Computer Vision Agent',
        type: 'vision',
        capabilities: [
          { type: 'fruit_counting', version: '1.0', maxConcurrency: 2 },
          { type: 'quality_assessment', version: '1.0', maxConcurrency: 3 },
          { type: 'maturity_detection', version: '1.0', maxConcurrency: 2 }
        ],
        version: '1.0.0',
        status: 'active',
        config: { accuracy: 97.8, confidenceThreshold: 0.85 }
      },
      {
        agentId: 'weather-intelligence',
        name: 'Weather Intelligence',
        type: 'environment',
        capabilities: [
          { type: 'weather_analysis', version: '1.0', maxConcurrency: 1 },
          { type: 'frost_prediction', version: '1.0', maxConcurrency: 2 },
          { type: 'microclimate_monitoring', version: '1.0', maxConcurrency: 3 }
        ],
        version: '1.0.0',
        status: 'active',
        config: { forecastAccuracy: 92.1, updateInterval: 10 }
      }
    ];

    for (const agentData of defaultAgents) {
      await this.registerAgent(agentData);
      
      // Simulate heartbeat
      await this.heartbeat({
        agentId: agentData.agentId,
        capabilities: agentData.capabilities,
        lastSeen: new Date().toISOString(),
        load: Math.random() * 0.3, // Random load 0-30%
        version: agentData.version,
        status: 'healthy'
      });
    }
  }

  // === Legacy Compatibility Methods ===
  
  async getAgentStatus() {
    const totalAgents = this.agents.size;
    const activeAgents = Array.from(this.agents.values()).filter(a => a.status === 'active').length;
    const healthyAgents = Array.from(this.heartbeats.values()).filter(h => h.status === 'healthy').length;
    
    return {
      totalAgents,
      activeAgents,
      healthyAgents,
      status: this.isInitialized ? 'operational' : 'initializing',
      capabilities: this.getUniqueCapabilities(),
      lastUpdate: new Date().toISOString()
    };
  }

  getUniqueCapabilities() {
    const capabilities = new Set();
    for (const agent of this.agents.values()) {
      agent.capabilities.forEach(cap => capabilities.add(cap.type));
    }
    return Array.from(capabilities);
  }

  async executeTask(taskType, payload) {
    // Legacy method - delegate to new system
    const { taskId } = await this.submitTask({
      type: taskType,
      payload,
      requiredCapability: taskType,
      priority: 2
    });
    
    return { taskId, success: true, message: 'Task submitted to enhanced orchestrator' };
  }

  async getEvents(limit = 50) {
    if (!this.supabaseService.supabase) {
      logger.warn('Supabase not configured, returning empty events');
      return [];
    }

    try {
      const { data: events, error } = await this.supabaseService.supabase
        .from('orchestrator_events')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      
      return events.map(this.mapEventFromDb);
    } catch (error) {
      logger.error('Failed to get events:', error);
      return [];
    }
  }

  // === Database Helper Methods ===
  
  async loadAgentsFromDatabase() {
    if (!this.supabaseService.supabase) {
      logger.warn('Supabase not configured, initializing default agents in memory');
      await this.initializeDefaultAgents();
      return;
    }

    try {
      const { data: agents, error } = await this.supabaseService.supabase
        .from('orchestrator_agents')
        .select('*');
      
      if (error) throw error;
      
      // Load agents into cache
      agents.forEach(agentData => {
        const agent = this.mapAgentFromDb(agentData);
        this.agents.set(agent.agentId, agent);
      });
      
      logger.info(`✅ Loaded ${agents.length} agents from database`);
    } catch (error) {
      logger.error('Failed to load agents from database:', error);
      // Fallback to default agents
      await this.initializeDefaultAgents();
    }
  }
  
  async persistTask(task) {
    if (!this.supabaseService.supabase) {
      logger.warn('Supabase not configured, task not persisted');
      return;
    }

    try {
      const { error } = await this.supabaseService.supabase
        .from('orchestrator_tasks')
        .insert({
          task_id: task.taskId,
          type: task.type,
          payload: task.payload,
          priority: task.priority,
          idempotency_key: task.idempotencyKey,
          required_capability: task.requiredCapability,
          timeout_ms: task.timeout,
          retry_policy: task.retryPolicy,
          scheduled_at: task.scheduledAt
        });
      
      if (error) throw error;
    } catch (error) {
      logger.error(`Failed to persist task ${task.taskId}:`, error);
      throw error;
    }
  }
  
  async persistTaskRun(run) {
    if (!this.supabaseService.supabase) {
      logger.warn('Supabase not configured, task run not persisted');
      return;
    }

    try {
      const { error } = await this.supabaseService.supabase
        .from('orchestrator_task_runs')
        .upsert({
          run_id: run.runId,
          task_id: run.taskId,
          agent_id: run.agentId,
          status: run.status,
          started_at: run.startedAt,
          completed_at: run.completedAt,
          result: run.result,
          error: run.error,
          attempt: run.attempt,
          trace_id: run.traceId
        });
      
      if (error) throw error;
    } catch (error) {
      logger.error(`Failed to persist task run ${run.runId}:`, error);
    }
  }
  
  mapAgentFromDb(dbAgent) {
    return {
      agentId: dbAgent.agent_id,
      name: dbAgent.name,
      type: dbAgent.type,
      capabilities: dbAgent.capabilities,
      version: dbAgent.version,
      status: dbAgent.status,
      lastHeartbeat: dbAgent.last_heartbeat,
      config: dbAgent.config,
      registeredAt: dbAgent.registered_at,
      updatedAt: dbAgent.updated_at
    };
  }
  
  mapTaskRunFromDb(dbRun) {
    return {
      runId: dbRun.run_id,
      taskId: dbRun.task_id,
      agentId: dbRun.agent_id,
      status: dbRun.status,
      startedAt: dbRun.started_at,
      completedAt: dbRun.completed_at,
      result: dbRun.result,
      error: dbRun.error,
      attempt: dbRun.attempt,
      traceId: dbRun.trace_id
    };
  }
  
  mapEventFromDb(dbEvent) {
    return {
      eventId: dbEvent.event_id,
      taskId: dbEvent.task_id,
      runId: dbEvent.run_id,
      agentId: dbEvent.agent_id,
      type: dbEvent.type,
      payload: dbEvent.payload,
      timestamp: dbEvent.timestamp,
      traceId: dbEvent.trace_id
    };
  }

  async shutdown() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    this.isInitialized = false;
    this.agents.clear();
    logger.info('🔄 Enhanced AI Agent Service shut down');
  }
}

module.exports = EnhancedAIAgentService;
