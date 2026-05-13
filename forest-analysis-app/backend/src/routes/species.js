import express from 'express';
import * as speciesController from '../controllers/speciesController.js';

const router = express.Router();

router.post('/', speciesController.createSpecies);
router.get('/', speciesController.getAllSpecies);
router.get('/:id', speciesController.getSpeciesById);
router.put('/:id', speciesController.updateSpecies);
router.delete('/:id', speciesController.deleteSpecies);

export default router;
