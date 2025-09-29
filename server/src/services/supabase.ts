import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Experiment, ExperimentLog, CreateExperimentRequest } from '../types';
import logger from '../utils/logger';

export class SupabaseService {
  private client: SupabaseClient | null = null;
  private isConfigured: boolean = false;

  constructor() {
    this.initializeClient();
  }

  private initializeClient(): void {
    const url = process.env['SUPABASE_URL'];
    const serviceRoleKey = process.env['SUPABASE_SERVICE_ROLE_KEY'];

    if (!url || !serviceRoleKey) {
      logger.warn('Supabase credentials not configured - some features will be disabled');
      this.isConfigured = false;
      return;
    }

    try {
      this.client = createClient(url, serviceRoleKey);
      this.isConfigured = true;
      logger.info('Supabase client initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Supabase client:', error);
      this.isConfigured = false;
    }
  }

  async checkHealth(): Promise<boolean> {
    if (!this.client) {
      return false;
    }

    try {
      const { error } = await this.client
        .from('users')
        .select('id')
        .limit(1);
      
      return !error;
    } catch (error) {
      logger.error('Supabase health check failed:', error);
      return false;
    }
  }

  // Experiment CRUD Operations
  async createExperiment(data: CreateExperimentRequest): Promise<Experiment> {
    if (!this.client) {
      throw new Error('Supabase not configured');
    }

    try {
      const experimentData = {
        user_id: data.user_id || null,
        name: data.name,
        status: 'pending' as const,
        started_at: new Date().toISOString(),
        metadata: data.metadata || {},
      };

      const { data: experiment, error } = await this.client
        .from('experiments')
        .insert(experimentData)
        .select()
        .single();

      if (error) throw error;

      logger.info(`Created experiment: ${experiment.id}`);
      return experiment;
    } catch (error) {
      logger.error('Failed to create experiment:', error);
      throw error;
    }
  }

  async getExperiment(id: string): Promise<Experiment | null> {
    if (!this.client) {
      throw new Error('Supabase not configured');
    }

    try {
      const { data: experiment, error } = await this.client
        .from('experiments')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        throw error;
      }

      return experiment;
    } catch (error) {
      logger.error(`Failed to get experiment ${id}:`, error);
      throw error;
    }
  }

  async getExperiments(page: number = 1, limit: number = 10): Promise<{ experiments: Experiment[]; total: number }> {
    if (!this.client) {
      throw new Error('Supabase not configured');
    }

    try {
      const offset = (page - 1) * limit;

      const { data: experiments, error, count } = await this.client
        .from('experiments')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return {
        experiments: experiments || [],
        total: count || 0,
      };
    } catch (error) {
      logger.error('Failed to get experiments:', error);
      throw error;
    }
  }

  async updateExperiment(id: string, updates: Partial<Experiment>): Promise<Experiment> {
    if (!this.client) {
      throw new Error('Supabase not configured');
    }

    try {
      const { data: experiment, error } = await this.client
        .from('experiments')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      logger.info(`Updated experiment: ${id}`);
      return experiment;
    } catch (error) {
      logger.error(`Failed to update experiment ${id}:`, error);
      throw error;
    }
  }

  // Experiment Logs
  async getExperimentLogs(experimentId: string): Promise<ExperimentLog[]> {
    if (!this.client) {
      throw new Error('Supabase not configured');
    }

    try {
      const { data: logs, error } = await this.client
        .from('experiment_logs')
        .select('*')
        .eq('experiment_id', experimentId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      return logs || [];
    } catch (error) {
      logger.error(`Failed to get logs for experiment ${experimentId}:`, error);
      throw error;
    }
  }

  async createExperimentLog(logData: Omit<ExperimentLog, 'id' | 'created_at'>): Promise<ExperimentLog> {
    if (!this.client) {
      throw new Error('Supabase not configured');
    }

    try {
      const { data: log, error } = await this.client
        .from('experiment_logs')
        .insert({
          ...logData,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      return log;
    } catch (error) {
      logger.error('Failed to create experiment log:', error);
      throw error;
    }
  }

  // Utility methods
  get isReady(): boolean {
    return this.isConfigured && this.client !== null;
  }
}

export default new SupabaseService();
