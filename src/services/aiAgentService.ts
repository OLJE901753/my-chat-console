import { apiClient, ApiClientError } from './apiClient';

// Enhanced collaboration interfaces
export interface CrewCollaboration {
  id: string;
  title: string;
  agents: string[];
  status: 'planning' | 'active' | 'paused' | 'completed';
  progress: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  startTime: Date;
  estimatedDuration: number;
  activeCollaborations: number;
  tasksInProgress: number;
  knowledgeSharing: number;
  collaborations: Collaboration[];
}

export interface Collaboration {
  id: string;
  title: string;
  agents: string[];
  status: string;
  progress: number;
  priority: string;
}

export interface AgentMemory {
  agentId: string;
  agentName: string;
  specialization: string;
  experiencePoints: number;
  memorySize: number;
  lastUpdated: Date;
}

export interface CollaborationLog {
  id: string;
  title: string;
  agents: string[];
  type: 'insight' | 'collaboration' | 'learning';
  timestamp: Date;
  details: string;
}

export interface WorkflowStatus {
  id: string;
  name: string;
  status: string;
  lastExecuted: Date;
  successRate: number;
}

class AIAgentAPIService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NODE_ENV === 'production' 
      ? '/api'
      : 'http://localhost:3001/api';
  }

  private async handleApiCall<T>(apiCall: () => Promise<T>): Promise<T> {
    try {
      return await apiCall();
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new ApiClientError(
        error instanceof Error ? error.message : 'An unexpected error occurred',
        0,
        'UNKNOWN_ERROR'
      );
    }
  }

  private async apiCall(endpoint: string, options: RequestInit = {}) {
    return this.handleApiCall(async () => {
      const url = `${this.baseUrl}${endpoint}`;
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });
      
      if (!response.ok) {
        throw new ApiClientError(`Request failed with status ${response.status}`, response.status);
      }
      
      return await response.json();
    });
  }

  // Get overall agent status
  async getAgentStatus() {
    return this.apiCall('/ai-agents/status');
  }

  // Get agent metrics for specific timeframe
  async getAgentMetrics(agentId: string, timeframe: string = '24h') {
    return this.apiCall(`/ai-agents/metrics/${agentId}?timeframe=${timeframe}`);
  }

  // Get active alerts
  async getActiveAlerts(agentId?: string) {
    const query = agentId ? `?agentId=${agentId}` : '';
    return this.apiCall(`/ai-agents/alerts${query}`);
  }

  // Acknowledge alert
  async acknowledgeAlert(alertId: string) {
    return this.apiCall(`/ai-agents/alerts/${alertId}/acknowledge`, {
      method: 'POST',
    });
  }

  // Trigger automated analysis
  async triggerAutomatedAnalysis() {
    return this.apiCall('/ai-agents/analyze/auto', {
      method: 'POST',
    });
  }

  // Crop Health Monitor
  async analyzeCropHealth(imageData: any, metadata?: any) {
    return this.apiCall('/ai-agents/crop-health/analyze', {
      method: 'POST',
      body: JSON.stringify({ imageData, metadata }),
    });
  }

  // Irrigation Optimizer
  async optimizeIrrigation(sensorData: any, weatherData?: any) {
    return this.apiCall('/ai-agents/irrigation/optimize', {
      method: 'POST',
      body: JSON.stringify({ sensorData, weatherData }),
    });
  }

  // Predictive Maintenance
  async analyzePredictiveMaintenance(equipmentData: any) {
    return this.apiCall('/ai-agents/maintenance/analyze', {
      method: 'POST',
      body: JSON.stringify({ equipmentData }),
    });
  }

  // Weather Intelligence
  async analyzeWeatherIntelligence(currentWeather?: any, forecast?: any) {
    return this.apiCall('/ai-agents/weather/analyze', {
      method: 'POST',
      body: JSON.stringify({ currentWeather, forecast }),
    });
  }

  // Computer Vision
  async analyzeComputerVision(imageData: any, analysisType?: string) {
    return this.apiCall('/ai-agents/vision/analyze', {
      method: 'POST',
      body: JSON.stringify({ imageData, analysisType }),
    });
  }

  // Health check
  async healthCheck() {
    return this.apiCall('/ai-agents/health');
  }

  // Drone Pilot AI - Mission Planning
  async planDroneMission(missionData: any) {
    return this.apiCall('/ai-agents/drone/mission-plan', {
      method: 'POST',
      body: JSON.stringify(missionData),
    });
  }

  // Drone Pilot AI - Execute Mission
  async executeDroneMission(missionId: string) {
    return this.apiCall(`/ai-agents/drone/mission/${missionId}/execute`, {
      method: 'POST',
    });
  }

  // Drone Pilot AI - Emergency Stop
  async emergencyStopDrone(droneId: string) {
    return this.apiCall(`/ai-agents/drone/${droneId}/emergency-stop`, {
      method: 'POST',
    });
  }

  // Content Creation Agent - Plan Content Capture
  async planContentCapture(contentPlan: any) {
    return this.apiCall('/ai-agents/content/plan-capture', {
      method: 'POST',
      body: JSON.stringify(contentPlan),
    });
  }

  // Content Creation Agent - Execute Content Plan
  async executeContentPlan(planId: string) {
    return this.apiCall(`/ai-agents/content/plan/${planId}/execute`, {
      method: 'POST',
    });
  }

  // Content Creation Agent - Quality Assessment
  async assessContentQuality(contentId: string) {
    return this.apiCall(`/ai-agents/content/${contentId}/assess-quality`);
  }

  // Customer Service AI - Handle Inquiry
  async handleCustomerInquiry(inquiryData: any) {
    return this.apiCall('/ai-agents/customer-service/inquiry', {
      method: 'POST',
      body: JSON.stringify(inquiryData),
    });
  }

  // Customer Service AI - Simulate Phone Call
  async simulatePhoneCall(callData: any) {
    return this.apiCall('/ai-agents/customer-service/phone-call', {
      method: 'POST',
      body: JSON.stringify(callData),
    });
  }

  // Customer Service AI - Process Email
  async processEmail(emailData: any) {
    return this.apiCall('/ai-agents/customer-service/email', {
      method: 'POST',
      body: JSON.stringify(emailData),
    });
  }

  // Customer Service AI - Website Chat
  async handleWebsiteChat(message: string, userId?: string, sessionId?: string) {
    return this.apiCall('/ai-agents/customer-service/website-chat', {
      method: 'POST',
      body: JSON.stringify({ message, user_id: userId, session_id: sessionId }),
    });
  }

  // Enhanced Drone Pilot AI - Advanced Mission Planning
  async generateAdvancedDroneMission(missionData: {
    mission_type: string;
    area: string;
    priority?: string;
    weather_conditions?: any;
  }) {
    return this.apiCall('/ai-agents/drone-pilot/advanced-mission', {
      method: 'POST',
      body: JSON.stringify(missionData),
    });
  }

  // Enhanced Content Creation Agent - Social Media Optimization
  async optimizeContentForSocialMedia(contentData: {
    content_id: string;
    platform?: string;
    content_type?: string;
    target_audience?: string;
  }) {
    return this.apiCall('/ai-agents/content-creation/social-media-optimization', {
      method: 'POST',
      body: JSON.stringify(contentData),
    });
  }

  // Enhanced Content Creation Agent - Trend Analysis
  async analyzeContentTrends(industry?: string, platform?: string, timeframe?: string) {
    return this.apiCall('/ai-agents/content-creation/trend-analysis', {
      method: 'POST',
      body: JSON.stringify({ industry, platform, timeframe }),
    });
  }

  // Enhanced Content Creation Agent - Hashtag Optimization
  async optimizeHashtags(optimizationData: {
    content_type: string;
    platform: string;
    target_audience?: string;
    industry?: string;
  }) {
    return this.apiCall('/ai-agents/content-creation/hashtag-optimization', {
      method: 'POST',
      body: JSON.stringify(optimizationData),
    });
  }

  // Enhanced Content Creation Agent - Posting Time Optimization
  async optimizePostingTimes(optimizationData: {
    platform: string;
    target_audience?: string;
    content_type?: string;
    timezone?: string;
  }) {
    return this.apiCall('/ai-agents/content-creation/posting-time-optimization', {
      method: 'POST',
      body: JSON.stringify(optimizationData),
    });
  }

  // Enhanced CrewAI-like collaboration methods
  async initiateCrewCollaboration(collaborationData: {
    title: string;
    agents: string[];
    priority: string;
    estimatedDuration: number;
  }) {
    return this.apiCall('/ai-agents/crew/collaboration', {
      method: 'POST',
      body: JSON.stringify(collaborationData),
    });
  }

  async getCrewStatus() {
    return this.apiCall('/ai-agents/crew/status', {
      method: 'GET',
    });
  }

  async getAgentMemory(agentId?: string) {
    const url = agentId ? `/ai-agents/memory/${agentId}` : '/ai-agents/memory';
    return this.apiCall(url, {
      method: 'GET',
    });
  }

  async getCollaborationLogs(limit?: number) {
    const url = limit ? `/ai-agents/collaboration/logs?limit=${limit}` : '/ai-agents/collaboration/logs';
    return this.apiCall(url, {
      method: 'GET',
    });
  }

  async getWorkflowStatus() {
    return this.apiCall('/ai-agents/workflows/status', {
      method: 'GET',
    });
  }

  // Enhanced multi-agent decision making
  async executeMultiAgentDecision(decisionData: {
    agents: string[];
    context: string;
    priority: string;
    constraints: any;
  }) {
    return this.apiCall('/ai-agents/crew/decision', {
      method: 'POST',
      body: JSON.stringify(decisionData),
    });
  }

  // Knowledge sharing between agents
  async shareKnowledge(knowledgeData: {
    sourceAgent: string;
    targetAgents: string[];
    knowledgeType: string;
    content: any;
    confidence: number;
  }) {
    return this.apiCall('/ai-agents/knowledge/share', {
      method: 'POST',
      body: JSON.stringify(knowledgeData),
    });
  }

  // Crisis management protocol
  async initiateCrisisResponse(crisisData: {
    type: string;
    severity: string;
    affectedAreas: string[];
    immediateActions: string[];
  }) {
    return this.apiCall('/ai-agents/crisis/response', {
      method: 'POST',
      body: JSON.stringify(crisisData),
    });
  }

}

export const aiAgentAPI = new AIAgentAPIService();
