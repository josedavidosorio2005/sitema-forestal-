import express from 'express';
import * as speciesController from '../controllers/speciesController.js';
import { handleValidation } from '../middleware/validate.js';
import {
  idParam,
  speciesCreateOrUpdateValidators,
  speciesQueryValidators,
} from './validators.js';

const router = express.Router();

router.post(
  '/',
  speciesCreateOrUpdateValidators,
  handleValidation,
  speciesController.createSpecies
);
router.get('/', speciesQueryValidators, handleValidation, speciesController.getAllSpecies);
router.get('/:id', idParam('id'), handleValidation, speciesController.getSpeciesById);
router.put(
  '/:id',
  idParam('id'),
  speciesCreateOrUpdateValidators,
  handleValidation,
  speciesController.updateSpecies
);
router.delete('/:id', idParam('id'), handleValidation, speciesController.deleteSpecies);

export default router;
