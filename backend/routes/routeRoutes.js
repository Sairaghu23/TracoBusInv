import express from 'express';
<<<<<<< HEAD
import {
    getAllRoutesController,
    addRouteController,
    updateRouteController,
    deleteRouteController,
    updateStopController,
    deleteStopController
=======
import { 
    getAllRoutesController, 
    addRouteController, 
    updateRouteController, 
    updateStopController
>>>>>>> ebd537dc (fixed fuel entry issue in the deisel section)
} from '../controllers/routeControllers.js';
import { getRouteStudentBreakdownController } from '../controllers/studentController.js';
import { addStoppingController } from '../controllers/stoppingController.js';

const router = express.Router();

<<<<<<< HEAD
// ⚠️ Specific /stops routes MUST come before the wildcard /:route_id
// otherwise Express matches 'stops' as the route_id parameter

// Stop management
router.post('/stops', addStoppingController);
router.put('/stops/:stop_id', updateStopController);
router.delete('/stops/:stop_id', deleteStopController);

// Route management
router.get('/', getAllRoutesController);
router.post('/', addRouteController);
router.put('/:route_id', updateRouteController);
router.delete('/:route_id', deleteRouteController);
router.get('/:id/student-breakdown', getRouteStudentBreakdownController);

=======
router.get('/', getAllRoutesController);
router.post('/', addRouteController);
router.put('/:route_id', updateRouteController);
router.get('/:id/student-breakdown', getRouteStudentBreakdownController);

// Stop management within routes context
router.post('/stops', addStoppingController);
router.put('/stops/:stop_id', updateStopController);

>>>>>>> ebd537dc (fixed fuel entry issue in the deisel section)
export default router;
