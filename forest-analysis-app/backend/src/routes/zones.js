import express from 'express';
import * as zonesController from '../controllers/zonesController.js';
import * as reportsController from '../controllers/reportsController.js';

const router = express.Router();

router.post('/', zonesController.createZone);
router.get('/', zonesController.getAllZones);

router.get('/:id/report', reportsController.getLatestReportForZone);
router.post('/:zoneId/report', reportsController.createReport);
router.get('/:zoneId/reports', reportsController.getReportsByZoneId);

router.get('/:id', zonesController.getZoneById);
router.put('/:id', zonesController.updateZone);
router.delete('/:id', zonesController.deleteZone);

export default router;
