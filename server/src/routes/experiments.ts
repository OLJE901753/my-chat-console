import { Router } from 'express';
import experimentsController from '../controllers/experimentsController';

const router = Router();

// POST /experiments - Create new experiment
router.post('/', (req, res) => {
  experimentsController.createExperiment(req, res);
});

// GET /experiments - List experiments with pagination
router.get('/', (req, res) => {
  experimentsController.getExperiments(req, res);
});

// GET /experiments/:id - Get specific experiment
router.get('/:id', (req, res) => {
  experimentsController.getExperiment(req, res);
});

// PUT /experiments/:id - Update experiment
router.put('/:id', (req, res) => {
  experimentsController.updateExperiment(req, res);
});

// GET /experiments/:id/logs - Get experiment logs
router.get('/:id/logs', (req, res) => {
  experimentsController.getExperimentLogs(req, res);
});

export default router;
