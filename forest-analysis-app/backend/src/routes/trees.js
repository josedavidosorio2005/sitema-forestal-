import express from 'express';
import * as treesController from '../controllers/treesController.js';
import { handleValidation } from '../middleware/validate.js';
import { idParam, treeCreateValidators, treeUpdateValidators, treeLogCreateValidators } from './validators.js';

const router = express.Router();

// Rutas base: /api/trees
router.post('/', treeCreateValidators, handleValidation, treesController.createTree);
router.post('/batch', treesController.createTreesBatch);
router.get('/subzone/:subzoneId', idParam('subzoneId'), handleValidation, treesController.getTreesBySubzoneId);

router.get('/:id', idParam('id'), handleValidation, treesController.getTreeById);
router.put('/:id', treeUpdateValidators, handleValidation, treesController.updateTree);
router.delete('/:id', idParam('id'), handleValidation, treesController.deleteTree);

// Rutas de trazabilidad (Logs)
router.post('/:treeId/logs', idParam('treeId'), treeLogCreateValidators, handleValidation, treesController.createTreeLog);
router.get('/:treeId/logs', idParam('treeId'), handleValidation, treesController.getTreeLogs);

export default router;
