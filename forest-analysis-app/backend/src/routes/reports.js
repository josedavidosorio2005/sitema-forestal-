import express from 'express';
import * as reportsController from '../controllers/reportsController.js';

const router = express.Router();

router.post('/', reportsController.createReport);
router.get('/', reportsController.getAllReports);

// Keep these before /:id so "zone" is not treated as a report id.
router.post('/zone/:zoneId', reportsController.createReport);
router.get('/zone/:zoneId', reportsController.getReportsByZoneId);

router.get('/:id', reportsController.getReportById);
router.put('/:id', reportsController.updateReport);

export default router;
