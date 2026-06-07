import express from 'express';
import { 
    getOilTypesController, 
    getBusOilLogsController, 
    recordOilLogController 
} from '../controllers/oilController.js';

const router = express.Router();

router.get('/types', getOilTypesController);
// Note: /api/buses/:rc_plate_number/oils is handled in busRoutes.js

export default router;
