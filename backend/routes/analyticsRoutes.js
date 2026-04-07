import express from 'express';
import { 
    getDieselAnalyticsController, 
    getOilAnalyticsController, 
    getSpareAnalyticsController, 
    getFeeAnalyticsController, 
    getCalendarExpirationsController 
} from '../controllers/analyticsController.js';

const router = express.Router();

router.get('/diesel', getDieselAnalyticsController);
router.get('/oils', getOilAnalyticsController);
router.get('/spares', getSpareAnalyticsController);
router.get('/fees', getFeeAnalyticsController);
router.get('/calendar-expirations', getCalendarExpirationsController);

export default router;
