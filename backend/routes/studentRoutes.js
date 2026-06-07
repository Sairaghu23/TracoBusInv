import express from 'express';
import { 
    getStudentsBySemesterController, 
    getArchiveBatchesController, 
    getArchiveStudentsByBatchController, 
    getStudentPaymentHistoryController, 
    getStudentCountsController, 
    recordPaymentController, 
    addStudentController, 
    getBranchesController, 
    updateStudentController 
} from '../controllers/studentController.js';

const router = express.Router();

router.get('/summary/counts', getStudentCountsController);
router.get('/archive/batches', getArchiveBatchesController);
router.get('/archive/:type/:batch_start/:batch_end', getArchiveStudentsByBatchController);
router.get('/:type/:year/semester/:semester', getStudentsBySemesterController);
router.get('/:type/history/:s_id', getStudentPaymentHistoryController);
router.post('/:type/payment', recordPaymentController);
router.post('/:type', addStudentController);
router.put('/:type/:s_id', updateStudentController);

// Branch routes (could also be in a branchRoutes.js, but keeping it here for simplicity as per current Student context)
router.get('/branches', getBranchesController);
router.get('/', getBranchesController); // Alias for flat /api/branches

export default router;
