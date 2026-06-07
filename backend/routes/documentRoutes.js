import express from 'express';
import { 
    getDocumentTypesController, 
    getBusDocumentsController, 
    uploadBusDocumentController, 
<<<<<<< HEAD
    deleteBusDocumentController,
=======
>>>>>>> ebd537dc (fixed fuel entry issue in the deisel section)
    getExpiringDocumentsController, 
    getComplianceMatrixController 
} from '../controllers/documentController.js';

const router = express.Router();

router.get('/types', getDocumentTypesController);
router.get('/', getDocumentTypesController); // Alias for flat /api/document-types
router.get('/reminders', getExpiringDocumentsController);
router.get('/compliance-matrix', getComplianceMatrixController);
router.post('/upload', uploadBusDocumentController);
<<<<<<< HEAD
router.delete('/:documentId', deleteBusDocumentController);
=======
>>>>>>> ebd537dc (fixed fuel entry issue in the deisel section)
// Note: /api/buses/:id/documents is handled in busRoutes.js as a nested resource

export default router;
