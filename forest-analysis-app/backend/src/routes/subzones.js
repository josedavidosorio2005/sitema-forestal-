import express from 'express';
import * as subzonesController from '../controllers/subzonesController.js';
import { handleValidation } from '../middleware/validate.js';
import { idParam, subzoneCreateOrUpdateValidators } from './validators.js';

const router = express.Router();

router.get('/:id', idParam('id'), handleValidation, subzonesController.getSubzoneById);
router.put(
  '/:id',
  idParam('id'),
  subzoneCreateOrUpdateValidators,
  handleValidation,
  subzonesController.updateSubzone
);
router.delete('/:id', idParam('id'), handleValidation, subzonesController.deleteSubzone);

export default router;
