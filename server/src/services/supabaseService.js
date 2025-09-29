const { createClient } = require('@supabase/supabase-js');
const logger = require('../utils/logger');

class SupabaseService {
  constructor() {
    try {
      if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.warn('⚠️ Supabase environment variables not configured. Service will run in offline mode.');
        this.supabase = null;
        return;
      }
      
      this.supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );
      console.log('✅ Supabase client initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Supabase client:', error);
      this.supabase = null;
    }
  }

  // Drone Commands
  async logDroneCommand(command, parameters = {}, status = 'pending', result = null, executionTime = null) {
    if (!this.supabase) {
      logger.warn('Supabase not configured, skipping drone command log');
      return null;
    }
    
    try {
      const { data, error } = await this.supabase
        .from('drone_commands')
        .insert({
          command,
          parameters,
          status,
          result,
          execution_time: executionTime
        })
        .select()
        .single();
        
      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Failed to log drone command:', error);
      throw error;
    }
  }

  async getDroneCommands(limit = 50, offset = 0) {
    if (!this.supabase) {
      logger.warn('Supabase not configured, returning empty drone commands');
      return [];
    }
    
    try {
      const { data, error } = await this.supabase
        .from('drone_commands')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
        
      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Failed to get drone commands:', error);
      throw error;
    }
  }

  // AI Agent Tasks
  async logAgentTask(agentId, taskType, inputData, outputData, status, confidence, executionTime) {
    if (!this.supabase) {
      logger.warn('Supabase not configured, skipping agent task log');
      return null;
    }
    
    try {
      const { data, error } = await this.supabase
        .from('agent_tasks')
        .insert({
          agent_id: agentId,
          task_type: taskType,
          input_data: inputData,
          output_data: outputData,
          status,
          confidence,
          execution_time: executionTime,
          completed_at: status === 'completed' ? new Date().toISOString() : null
        })
        .select()
        .single();
        
      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Failed to log agent task:', error);
      throw error;
    }
  }

  async createAgentAlert(agentId, alertType, message, severity, data) {
    if (!this.supabase) {
      logger.warn('Supabase not configured, skipping agent alert creation');
      return null;
    }
    
    try {
      const { data: alert, error } = await this.supabase
        .from('agent_alerts')
        .insert({
          agent_id: agentId,
          alert_type: alertType,
          message,
          severity,
          data
        })
        .select()
        .single();
        
      if (error) throw error;
      return alert;
    } catch (error) {
      logger.error('Failed to create agent alert:', error);
      throw error;
    }
  }

  async getAgentMetrics(agentId, timeframe = '24h') {
    if (!this.supabase) {
      logger.warn('Supabase not configured, returning default metrics');
      return { total_tasks: 0, avg_execution_time: 0, avg_confidence: 0, success_rate: 0, timeframe };
    }
    
    try {
      const hoursBack = timeframe === '24h' ? 24 : timeframe === '7d' ? 168 : 24;
      
      const { data, error } = await this.supabase
        .rpc('get_agent_metrics', {
          p_agent_id: agentId,
          p_hours_back: hoursBack
        });
        
      if (error) throw error;
      return data;
    } catch (rpcError) {
      // Fallback to basic query if RPC doesn't exist
      logger.warn('Using fallback metrics query');
      
      const cutoffTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString();
      
      const { data, error } = await this.supabase
        .from('agent_tasks')
        .select('*')
        .eq('agent_id', agentId)
        .gte('created_at', cutoffTime);
        
      if (error) throw error;
      
      const totalTasks = data.length;
      const successfulTasks = data.filter(t => t.status === 'completed').length;
      const avgExecutionTime = data.reduce((sum, t) => sum + (t.execution_time || 0), 0) / totalTasks || 0;
      const avgConfidence = data.reduce((sum, t) => sum + (t.confidence || 0), 0) / totalTasks || 0;
      
      return {
        total_tasks: totalTasks,
        avg_execution_time: avgExecutionTime,
        avg_confidence: avgConfidence,
        success_rate: totalTasks > 0 ? (successfulTasks / totalTasks) * 100 : 0,
        timeframe
      };
    }
  }

  async getActiveAlerts(agentId = null) {
    if (!this.supabase) {
      logger.warn('Supabase not configured, returning empty alerts');
      return [];
    }
    
    try {
      let query = this.supabase
        .from('agent_alerts')
        .select('*')
        .eq('acknowledged', false)
        .order('created_at', { ascending: false });
        
      if (agentId) {
        query = query.eq('agent_id', agentId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Failed to get active alerts:', error);
      throw error;
    }
  }

  async acknowledgeAlert(alertId) {
    if (!this.supabase) {
      logger.warn('Supabase not configured, cannot acknowledge alert');
      return false;
    }
    
    try {
      const { error } = await this.supabase
        .from('agent_alerts')
        .update({ acknowledged: true })
        .eq('id', alertId);
        
      if (error) throw error;
      return true;
    } catch (error) {
      logger.error('Failed to acknowledge alert:', error);
      throw error;
    }
  }

  // Norwegian Weather Data
  async saveWeatherData(weatherData) {
    if (!this.supabase) {
      logger.warn('Supabase not configured, skipping weather data save');
      return null;
    }
    
    try {
      const { data, error } = await this.supabase
        .from('norwegian_weather_data')
        .insert(weatherData)
        .select()
        .single();
        
      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Failed to save weather data:', error);
      throw error;
    }
  }

  async saveFrostAlert(frostAlert) {
    if (!this.supabase) {
      logger.warn('Supabase not configured, skipping frost alert save');
      return null;
    }
    
    try {
      const { data, error } = await this.supabase
        .from('frost_alerts')
        .insert(frostAlert)
        .select()
        .single();
        
      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Failed to save frost alert:', error);
      throw error;
    }
  }

  async saveGrowingDegreeDay(gddData) {
    if (!this.supabase) {
      logger.warn('Supabase not configured, skipping GDD data save');
      return null;
    }
    
    try {
      const { data, error } = await this.supabase
        .from('growing_degree_days')
        .insert(gddData)
        .select()
        .single();
        
      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Failed to save GDD data:', error);
      throw error;
    }
  }

  // Health check
  async checkHealth() {
    if (!this.supabase) {
      logger.warn('Supabase not configured');
      return false;
    }
    
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select('id')
        .limit(1);
        
      if (error) throw error;
      return true;
    } catch (error) {
      logger.error('Supabase health check failed:', error);
      return false;
    }
  }
}

module.exports = SupabaseService;