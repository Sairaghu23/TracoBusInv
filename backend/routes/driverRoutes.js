import express from 'express';
import { 
    getAllDriversController, 
    getDriverByIdController, 
    addDriverController, 
    updateDriverController, 
    deleteDriverController,
    uploadDriverPhotoController
} from '../controllers/driverController.js';

const router = express.Router();

router.get('/', getAllDriversController);
router.get('/:id', getDriverByIdController);
router.post('/', addDriverController);
router.put('/:id', updateDriverController);
router.delete('/:id', deleteDriverController);
router.post('/:id/photo', uploadDriverPhotoController);

export default router;
