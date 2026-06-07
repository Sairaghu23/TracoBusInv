import express from 'express';
import { 
    getAllFleetReadingsController, 
    addBulkReadingsController 
} from '../controllers/readingController.js';

const router = express.Router();

router.get('/all-latest', getAllFleetReadingsController);
router.post('/bulk', addBulkReadingsController);

export default router;
