import express from 'express';
import { 
    getAllFleetReadingsController, 
    getFleetReadingsByDateController,
    getRecentFleetReadingsController,
    addBulkReadingsController,
    deleteReadingController
} from '../controllers/readingController.js';

const router = express.Router();

router.get('/all-latest', getAllFleetReadingsController);
router.get('/date/:date', getFleetReadingsByDateController);
router.get('/recent', getRecentFleetReadingsController);
router.post('/bulk', addBulkReadingsController);
router.delete('/:reading_id', deleteReadingController);

export default router;
