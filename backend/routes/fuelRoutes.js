import express from 'express';
import { 
    getFuelRateController, 
    updateFuelRateController, 
    validateOdometerStatusController, 
    saveBulkDieselController, 
    getDieselReportController 
} from '../controllers/dieselController.js';

const router = express.Router();

// This router handles both /api/fuel-rates and /api/diesel depending on mount point
// However, since we mount it at both, we need to be careful with paths.

// If mounted at /api/fuel-rates:
router.get('/:date', getFuelRateController);
router.post('/', updateFuelRateController);

// If mounted at /api/diesel:
router.get('/validate/:date', validateOdometerStatusController); 
router.post('/bulk', saveBulkDieselController);
router.get('/report/:date', getDieselReportController);

export default router;
