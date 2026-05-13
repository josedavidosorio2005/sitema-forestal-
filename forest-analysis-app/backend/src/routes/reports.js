import express from 'express';
import * as reportsController from '../controllers/reportsController.js';
import { handleValidation } from '../middleware/validate.js';
import {
  idParam,
  reportCreateValidators,
  reportUpdateValidators,
} from './validators.js';

const router = express.Router();

router.post('/', reportCreateValidators, handleValidation, reportsController.createReport);
router.get('/', reportsController.getAllReports);

// Keep these before /:id so "zone" is not treated as a report id.
router.post(
  '/zone/:zoneId',
  idParam('zoneId'),
  reportCreateValidators,
  handleValidation,
  reportsController.createReport
);
router.get(
  '/zone/:zoneId',
  idParam('zoneId'),
  handleValidation,
  reportsController.getReportsByZoneId
);

router.get('/:id', idParam('id'), handleValidation, reportsController.getReportById);
router.put('/:id', reportUpdateValidators, handleValidation, reportsController.updateReport);

export default router;
