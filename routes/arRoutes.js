// routes/arRoutes.js
import express from 'express';
import { arController } from '../controllers/arController.js';

const router = express.Router();

// GET /ar - Get all AR records
router.get('/', arController.getAllAR);


// GET /ar/:id - Get AR by ID
router.get('/:id', arController.getARById);


// PUT /ar/:id - Update AR record
router.put('/:id', arController.updateAR);

// DELETE /ar/:id - Delete AR record
router.delete('/:id', arController.deleteAR);

export default router;