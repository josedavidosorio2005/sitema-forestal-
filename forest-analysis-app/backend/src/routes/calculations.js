import express from 'express';
import * as calculationsController from '../controllers/calculationsController.js';
import { handleValidation } from '../middleware/validate.js';
import { logDragTensionValidators } from './validators.js';

const router = express.Router();

router.post(
  '/log-drag-tension',
  logDragTensionValidators,
  handleValidation,
  calculationsController.calculateLogDrag
);

export default router;
