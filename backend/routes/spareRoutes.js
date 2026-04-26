import express from 'express';
import { 
    getStocksController, 
    addSpareTypeController, 
    recordPurchaseController, 
    getSparePurchasesController,
    getInventoryController,
    getPurchaseCodesController,
    getUsageCodesController
} from '../controllers/spareController.js';

const router = express.Router();

router.get('/stocks', getStocksController);
router.post('/stocks', addSpareTypeController);
router.post('/purchases', recordPurchaseController);
router.get('/:spare_id/purchases', getSparePurchasesController);

// Inventory & Codes
router.get('/inventory/:spare_id', getInventoryController);
router.get('/purchases/:purchase_id/codes', getPurchaseCodesController);
router.get('/usage/:usage_id/codes', getUsageCodesController);

export default router;
