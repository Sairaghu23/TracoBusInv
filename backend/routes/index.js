import express from 'express';

// Import individual route modules
import busRoutes from './busRoutes.js';
import studentRoutes from './studentRoutes.js';
import driverRoutes from './driverRoutes.js';
import routeRoutes from './routeRoutes.js';
import analyticsRoutes from './analyticsRoutes.js';
import readingRoutes from './readingRoutes.js';
import spareRoutes from './spareRoutes.js';
import fuelRoutes from './fuelRoutes.js';
import oilRoutes from './oilRoutes.js';
import documentRoutes from './documentRoutes.js';
import authRoutes from './authRoutes.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.use('/auth', authRoutes);

// Protected routes (All endpoints below require a valid JWT)
router.use(authMiddleware);

// Register all routes with correct API prefixes
router.use('/routes', routeRoutes);
router.use('/buses', busRoutes);
router.use('/readings', readingRoutes);
router.use('/spares', spareRoutes);
router.use('/fuel-rates', fuelRoutes);
router.use('/diesel', fuelRoutes); // Diesel validation/reporting
router.use('/oils', oilRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/drivers', driverRoutes);
router.use('/students', studentRoutes);
router.use('/branches', studentRoutes); 
router.use('/documents', documentRoutes);

// Fix for flat API compatibility (unprefixed endpoints)
router.use('/document-types', documentRoutes); // Handles /api/document-types

export default router;
