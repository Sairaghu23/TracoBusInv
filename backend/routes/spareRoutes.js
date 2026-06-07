import express from 'express';
import { 
    getStocksController, 
    addSpareTypeController, 
    recordPurchaseController, 
<<<<<<< HEAD
    getSparePurchasesController,
    getInventoryController,
    getPurchaseCodesController,
    getUsageCodesController,
    getCostPerUnitController
=======
    getSparePurchasesController 
>>>>>>> ebd537dc (fixed fuel entry issue in the deisel section)
} from '../controllers/spareController.js';

const router = express.Router();

router.get('/stocks', getStocksController);
router.post('/stocks', addSpareTypeController);
router.post('/purchases', recordPurchaseController);
router.get('/:spare_id/purchases', getSparePurchasesController);
<<<<<<< HEAD
router.get('/:spare_id/cost', getCostPerUnitController);

// Inventory & Codes
router.get('/inventory/:spare_id', getInventoryController);
router.get('/purchases/:purchase_id/codes', getPurchaseCodesController);
router.get('/usage/:usage_id/codes', getUsageCodesController);
=======
>>>>>>> ebd537dc (fixed fuel entry issue in the deisel section)

export default router;
