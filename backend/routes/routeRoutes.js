import express from 'express';
import { 
    getAllRoutesController, 
    addRouteController, 
    updateRouteController, 
    updateStopController
} from '../controllers/routeControllers.js';
import { getRouteStudentBreakdownController } from '../controllers/studentController.js';
import { addStoppingController } from '../controllers/stoppingController.js';

const router = express.Router();

router.get('/', getAllRoutesController);
router.post('/', addRouteController);
router.put('/:route_id', updateRouteController);
router.get('/:id/student-breakdown', getRouteStudentBreakdownController);

// Stop management within routes context
router.post('/stops', addStoppingController);
router.put('/stops/:stop_id', updateStopController);

export default router;
