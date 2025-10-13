// routes/arRoutes.js
import express from 'express';
import { arController } from '../controllers/arController.js';

const router = express.Router();

// GET /ar - Get all AR records
router.get('/', arController.getAllAR);

// GET /ar/stats - Get AR statistics
router.get('/stats', arController.getARStats);

// GET /ar/missing - Create missing AR records
router.get('/missing', arController.createMissingAR);

// GET /ar/:id - Get AR by ID
router.get('/:id', arController.getARById);

// POST /ar - Create new AR record
router.post('/', arController.createAR);

// PUT /ar/:id - Update AR record
router.put('/:id', arController.updateAR);

// DELETE /ar/:id - Delete AR record
router.delete('/:id', arController.deleteAR);

export default router;