import express from 'express';
import { 
    getStocksController, 
    addSpareTypeController, 
    recordPurchaseController, 
    getSparePurchasesController 
} from '../controllers/spareController.js';

const router = express.Router();

router.get('/stocks', getStocksController);
router.post('/stocks', addSpareTypeController);
router.post('/purchases', recordPurchaseController);
router.get('/:spare_id/purchases', getSparePurchasesController);

export default router;
