import express from 'express';
import * as zonesController from '../controllers/zonesController.js';
import * as reportsController from '../controllers/reportsController.js';
import * as subzonesController from '../controllers/subzonesController.js';
import * as zoneEventsController from '../controllers/zoneEventsController.js';
import { handleValidation } from '../middleware/validate.js';
import {
  idParam,
  reportCreateValidators,
  subzoneCreateOrUpdateValidators,
  zoneEventCreateValidators,
  zoneCreateValidators,
  zoneUpdateValidators,
} from './validators.js';

const router = express.Router();

router.post('/', zoneCreateValidators, handleValidation, zonesController.createZone);
router.get('/', zonesController.getAllZones);

router.get('/:id/report', idParam('id'), handleValidation, reportsController.getLatestReportForZone);
router.post(
  '/:zoneId/report',
  idParam('zoneId'),
  reportCreateValidators,
  handleValidation,
  reportsController.createReport
);
router.get(
  '/:zoneId/reports',
  idParam('zoneId'),
  handleValidation,
  reportsController.getReportsByZoneId
);
router.get(
  '/:zoneId/subzones',
  idParam('zoneId'),
  handleValidation,
  subzonesController.getSubzonesByZoneId
);
router.get(
  '/:zoneId/events',
  idParam('zoneId'),
  handleValidation,
  zoneEventsController.getZoneEvents
);
router.post(
  '/:zoneId/events',
  zoneEventCreateValidators,
  handleValidation,
  zoneEventsController.createZoneEvent
);
router.delete(
  '/:zoneId/events/:eventId',
  idParam('zoneId'),
  idParam('eventId'),
  handleValidation,
  zoneEventsController.deleteZoneEvent
);
router.post(
  '/:zoneId/subzones',
  idParam('zoneId'),
  subzoneCreateOrUpdateValidators,
  handleValidation,
  subzonesController.createSubzone
);

router.get('/:id', idParam('id'), handleValidation, zonesController.getZoneById);
router.put('/:id', zoneUpdateValidators, handleValidation, zonesController.updateZone);
router.delete('/:id', idParam('id'), handleValidation, zonesController.deleteZone);

export default router;
