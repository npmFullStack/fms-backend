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

// ✅ NEW: GET /ar/:id/transactions - Get payment transactions for AR record
router.get('/:id/transactions', arController.getPaymentTransactions);

// ✅ NEW: POST /ar/:id/transactions - Create payment transaction for AR record
router.post('/:id/transactions', arController.createPaymentTransaction);

// ✅ NEW: GET /ar/search/:number - Get AR by booking number or HWB number
router.get('/search/:number', arController.getARByBookingNumber);

export default router;