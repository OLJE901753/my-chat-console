import { apiClient } from './apiClient';

export interface PythonAIResponse {
  success: boolean;
  output: string;
  operation: string;
  timestamp: string;
}

export interface PythonAIStatus {
  isRunning: boolean;
  pythonPath: string;
  timestamp: string;
  status?: string;
}

export interface DailyOperationsInput {
  farm_location?: string;
  current_season?: string;
  priority_focus?: string;
}

export interface CrisisResponseInput {
  emergencyType?: string;
  severity_level?: string;
  farm_location?: string;
}

export interface ContentCreationInput {
  content_focus?: string;
  target_platforms?: string[];
  content_type?: string;
}

export interface StrategicPlanningInput {
  planning_horizon?: string;
  farm_location?: string;
  focus_areas?: string[];
}

export class PythonAIService {
  private baseUrl = '/api/python-ai';

  async getStatus(): Promise<PythonAIStatus> {
    try {
      // Try to check if server is running
      const response = await apiClient.get<PythonAIStatus>(`${this.baseUrl}/status`);
      return response;
    } catch {
      // Server not running - return offline status
      return {
        isRunning: false,
        pythonPath: 'python',
        timestamp: new Date().toISOString(),
        status: 'offline'
      };
    }
  }

  async runDailyOperations(inputs: DailyOperationsInput = {}): Promise<PythonAIResponse> {
    try {
      const response = await apiClient.post<{ status: string; output?: string }>(`${this.baseUrl}/run-ai-task`, {
        taskType: 'daily',
        inputs
      });
      return {
        success: response.status === 'success',
        output: response.output || '',
        operation: 'daily',
        timestamp: new Date().toISOString()
      };
    } catch {
      return {
        success: false,
        output: `Error: Server not running. Please start the Node.js server first.`,
        operation: 'daily',
        timestamp: new Date().toISOString()
      };
    }
  }

  async runCrisisResponse(inputs: CrisisResponseInput = {}): Promise<PythonAIResponse> {
    try {
      const response = await apiClient.post<{ status: string; output?: string }>(`${this.baseUrl}/run-ai-task`, {
        taskType: 'crisis',
        inputs
      });
      return {
        success: response.status === 'success',
        output: response.output || '',
        operation: 'crisis',
        timestamp: new Date().toISOString()
      };
    } catch {
      return {
        success: false,
        output: `Error: Server not running. Please start the Node.js server first.`,
        operation: 'crisis',
        timestamp: new Date().toISOString()
      };
    }
  }

  async runContentCreation(inputs: ContentCreationInput = {}): Promise<PythonAIResponse> {
    try {
      const response = await apiClient.post<{ status: string; output?: string }>(`${this.baseUrl}/run-ai-task`, {
        taskType: 'content',
        inputs
      });
      return {
        success: response.status === 'success',
        output: response.output || '',
        operation: 'content',
        timestamp: new Date().toISOString()
      };
    } catch {
      return {
        success: false,
        output: `Error: Server not running. Please start the Node.js server first.`,
        operation: 'content',
        timestamp: new Date().toISOString()
      };
    }
  }

  async runStrategicPlanning(inputs: StrategicPlanningInput = {}): Promise<PythonAIResponse> {
    try {
      const response = await apiClient.post<{ status: string; output?: string }>(`${this.baseUrl}/run-ai-task`, {
        taskType: 'strategic',
        inputs
      });
      return {
        success: response.status === 'success',
        output: response.output || '',
        operation: 'strategic',
        timestamp: new Date().toISOString()
      };
    } catch {
      return {
        success: false,
        output: `Error: Server not running. Please start the Node.js server first.`,
        operation: 'strategic',
        timestamp: new Date().toISOString()
      };
    }
  }

  async runFullCrew(inputs: Record<string, unknown> = {}): Promise<PythonAIResponse> {
    try {
      const response = await apiClient.post<{ status: string; output?: string }>(`${this.baseUrl}/run-ai-task`, {
        taskType: 'full',
        inputs
      });
      return {
        success: response.status === 'success',
        output: response.output || '',
        operation: 'full',
        timestamp: new Date().toISOString()
      };
    } catch {
      return {
        success: false,
        output: `Error: Server not running. Please start the Node.js server first.`,
        operation: 'full',
        timestamp: new Date().toISOString()
      };
    }
  }

  async runTest(inputs: Record<string, unknown> = {}): Promise<PythonAIResponse> {
    try {
      const response = await apiClient.post<{ status: string; output?: string }>(`${this.baseUrl}/run-ai-task`, {
        taskType: 'test',
        inputs
      });
      return {
        success: response.status === 'success',
        output: response.output || '',
        operation: 'test',
        timestamp: new Date().toISOString()
      };
    } catch {
      return {
        success: false,
        output: `Error: Server not running. Please start the Node.js server first.`,
        operation: 'test',
        timestamp: new Date().toISOString()
      };
    }
  }
}

export const pythonAIService = new PythonAIService();
