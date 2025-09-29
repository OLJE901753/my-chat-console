import { Request, Response } from 'express';
import { Experiment, CreateExperimentRequest, ApiResponse, PaginatedResponse } from '../types';
import supabaseService from '../services/supabase';
import logger from '../utils/logger';

export class ExperimentsController {
  // POST /experiments
  async createExperiment(req: Request, res: Response): Promise<void> {
    try {
      const { name, user_id, metadata }: CreateExperimentRequest = req.body;

      // Validation
      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        res.status(400).json({
          success: false,
          error: 'Experiment name is required and must be a non-empty string'
        } as ApiResponse);
        return;
      }

      if (user_id && typeof user_id !== 'string') {
        res.status(400).json({
          success: false,
          error: 'User ID must be a string if provided'
        } as ApiResponse);
        return;
      }

      if (metadata && typeof metadata !== 'object') {
        res.status(400).json({
          success: false,
          error: 'Metadata must be an object if provided'
        } as ApiResponse);
        return;
      }

      const experiment = await supabaseService.createExperiment({
        name: name.trim(),
        user_id: user_id || undefined,
        metadata: metadata || undefined
      });

      logger.info(`Created experiment: ${experiment.id} for user: ${user_id || 'anonymous'}`);

      res.status(201).json({
        success: true,
        data: experiment,
        message: 'Experiment created successfully'
      } as ApiResponse<Experiment>);

    } catch (error) {
      logger.error('Failed to create experiment:', error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to create experiment',
        message: 'An internal server error occurred'
      } as ApiResponse);
    }
  }

  // GET /experiments/:id
  async getExperiment(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id || typeof id !== 'string') {
        res.status(400).json({
          success: false,
          error: 'Valid experiment ID is required'
        } as ApiResponse);
        return;
      }

      const experiment = await supabaseService.getExperiment(id);

      if (!experiment) {
        res.status(404).json({
          success: false,
          error: 'Experiment not found',
          message: `No experiment found with ID: ${id}`
        } as ApiResponse);
        return;
      }

      res.json({
        success: true,
        data: experiment
      } as ApiResponse<Experiment>);

    } catch (error) {
      logger.error(`Failed to get experiment ${req.params['id']}:`, error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve experiment',
        message: 'An internal server error occurred'
      } as ApiResponse);
    }
  }

  // GET /experiments
  async getExperiments(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query['page'] as string) || 1;
      const limit = Math.min(parseInt(req.query['limit'] as string) || 10, 100); // Max 100 per page

      if (page < 1) {
        res.status(400).json({
          success: false,
          error: 'Page number must be greater than 0'
        } as ApiResponse);
        return;
      }

      if (limit < 1) {
        res.status(400).json({
          success: false,
          error: 'Limit must be greater than 0'
        } as ApiResponse);
        return;
      }

      const { experiments, total } = await supabaseService.getExperiments(page, limit);
      const totalPages = Math.ceil(total / limit);

      res.json({
        success: true,
        data: experiments,
        pagination: {
          page,
          limit,
          total,
          totalPages
        }
      } as PaginatedResponse<Experiment>);

    } catch (error) {
      logger.error('Failed to get experiments:', error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve experiments',
        message: 'An internal server error occurred'
      } as ApiResponse);
    }
  }

  // PUT /experiments/:id
  async updateExperiment(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updates = req.body;

      if (!id || typeof id !== 'string') {
        res.status(400).json({
          success: false,
          error: 'Valid experiment ID is required'
        } as ApiResponse);
        return;
      }

      // Validate allowed update fields
      const allowedFields = ['name', 'status', 'metadata'];
      const updateData: Partial<Experiment> = {};

      for (const [key, value] of Object.entries(updates)) {
        if (allowedFields.includes(key)) {
          (updateData as any)[key] = value;
        }
      }

      if (Object.keys(updateData).length === 0) {
        res.status(400).json({
          success: false,
          error: 'No valid fields provided for update'
        } as ApiResponse);
        return;
      }

      const experiment = await supabaseService.updateExperiment(id, updateData);

      logger.info(`Updated experiment: ${id}`);

      res.json({
        success: true,
        data: experiment,
        message: 'Experiment updated successfully'
      } as ApiResponse<Experiment>);

    } catch (error) {
      logger.error(`Failed to update experiment ${req.params['id']}:`, error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to update experiment',
        message: 'An internal server error occurred'
      } as ApiResponse);
    }
  }

  // GET /experiments/:id/logs
  async getExperimentLogs(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id || typeof id !== 'string') {
        res.status(400).json({
          success: false,
          error: 'Valid experiment ID is required'
        } as ApiResponse);
        return;
      }

      // Check if experiment exists
      const experiment = await supabaseService.getExperiment(id);
      if (!experiment) {
        res.status(404).json({
          success: false,
          error: 'Experiment not found'
        } as ApiResponse);
        return;
      }

      const logs = await supabaseService.getExperimentLogs(id);

      res.json({
        success: true,
        data: logs
      } as ApiResponse);

    } catch (error) {
      logger.error(`Failed to get logs for experiment ${req.params['id']}:`, error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve experiment logs',
        message: 'An internal server error occurred'
      } as ApiResponse);
    }
  }
}

export default new ExperimentsController();
