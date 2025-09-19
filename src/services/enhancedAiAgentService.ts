import { AgentRegistry, AgentMetrics, QueueStats, AgentEvent, Task } from '@/types/agents';

class EnhancedAIAgentAPIService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NODE_ENV === 'production' 
      ? '/api'
      : 'http://localhost:3001/api';
  }

  private async apiCall(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || `Request failed with status ${response.status}`);
    }
    
    return await response.json();
  }

  // === Core Orchestrator Methods ===
  
  async submitTask(task: Omit<Task, 'taskId' | 'createdAt'>): Promise<{ taskId: string }> {
    return this.apiCall('/ai-agents/tasks', {
      method: 'POST',
      body: JSON.stringify(task),
      headers: {
        'X-Trace-ID': `frontend-${Date.now()}`
      }
    });
  }

  async getTaskStatus(taskId: string) {
    return this.apiCall(`/ai-agents/tasks/${taskId}`);
  }

  async cancelTask(taskId: string, reason?: string) {
    return this.apiCall(`/ai-agents/tasks/${taskId}`, {
      method: 'DELETE',
      body: JSON.stringify({ reason })
    });
  }

  async getAvailableAgents(capability?: string): Promise<{ agents: AgentRegistry[] }> {
    const query = capability ? `?capability=${capability}` : '';
    return this.apiCall(`/ai-agents/agents${query}`);
  }

  async getAgentMetrics(agentId?: string): Promise<{ metrics: AgentMetrics[] }> {
    const query = agentId ? `?agentId=${agentId}` : '';
    return this.apiCall(`/ai-agents/metrics${query}`);
  }

  async getQueueStats(): Promise<QueueStats> {
    return this.apiCall('/ai-agents/queue/stats');
  }

  async getSystemEvents(limit = 50): Promise<{ events: AgentEvent[] }> {
    return this.apiCall(`/ai-agents/events?limit=${limit}`);
  }

  async registerAgent(agent: Omit<AgentRegistry, 'registeredAt' | 'updatedAt'>) {
    return this.apiCall('/ai-agents/register', {
      method: 'POST',
      body: JSON.stringify(agent)
    });
  }

  async sendHeartbeat(heartbeat: any) {
    return this.apiCall('/ai-agents/heartbeat', {
      method: 'POST',
      body: JSON.stringify(heartbeat)
    });
  }

  async getSystemDiagnostics() {
    return this.apiCall('/ai-agents/diagnostics');
  }

  // === Specialized Task Methods ===
  
  async analyzeComputerVision(imageData: any, analysisType = 'fruit_counting') {
    return this.apiCall('/ai-agents/vision/analyze', {
      method: 'POST',
      body: JSON.stringify({ imageData, analysisType })
    });
  }

  async optimizeIrrigation(sensorData: any, weatherData?: any) {
    return this.apiCall('/ai-agents/irrigation/optimize', {
      method: 'POST',
      body: JSON.stringify({ sensorData, weatherData })
    });
  }

  async analyzeCropHealth(imageData: any, metadata?: any) {
    return this.apiCall('/ai-agents/crop-health/analyze', {
      method: 'POST',
      body: JSON.stringify({ imageData, metadata })
    });
  }

  async planDroneMission(missionData: { mission_type: string; area: string; priority?: string }) {
    return this.apiCall('/ai-agents/drone/mission-plan', {
      method: 'POST',
      body: JSON.stringify(missionData)
    });
  }

  async analyzeWeatherIntelligence(currentWeather?: any, forecast?: any) {
    return this.apiCall('/ai-agents/weather/analyze', {
      method: 'POST',
      body: JSON.stringify({ currentWeather, forecast })
    });
  }

  // === Legacy Compatibility ===
  
  async getAgentStatus() {
    return this.apiCall('/ai-agents/status');
  }

  async executeTask(taskType: string, payload: any) {
    return this.apiCall('/ai-agents/execute', {
      method: 'POST',
      body: JSON.stringify({ taskType, payload })
    });
  }

  async triggerAutomatedAnalysis() {
    // Submit multiple analysis tasks
    const tasks = [
      { type: 'crop_analysis', requiredCapability: 'crop_analysis', payload: { automated: true } },
      { type: 'irrigation_optimization', requiredCapability: 'irrigation_optimization', payload: { automated: true } },
      { type: 'weather_analysis', requiredCapability: 'weather_analysis', payload: { automated: true } }
    ];

    const results = await Promise.allSettled(
      tasks.map(task => this.submitTask({ ...task, priority: 1 }))
    );

    return {
      success: true,
      submittedTasks: results.filter(r => r.status === 'fulfilled').length,
      totalTasks: tasks.length,
      tasks: results.map((r, i) => ({
        type: tasks[i].type,
        success: r.status === 'fulfilled',
        result: r.status === 'fulfilled' ? r.value : r.reason
      }))
    };
  }

  async healthCheck() {
    return this.apiCall('/ai-agents/health');
  }

  // === Placeholder methods for legacy compatibility ===
  
  async getActiveAlerts() {
    // For now, return empty alerts - could be enhanced later
    return [];
  }

  async acknowledgeAlert(alertId: string) {
    // Placeholder - could be enhanced later
    return { success: true };
  }
}

export const enhancedAiAgentAPI = new EnhancedAIAgentAPIService();
