import express from 'express';
import { 
    getDocumentTypesController, 
    getBusDocumentsController, 
    uploadBusDocumentController, 
    getExpiringDocumentsController, 
    getComplianceMatrixController 
} from '../controllers/documentController.js';

const router = express.Router();

router.get('/types', getDocumentTypesController);
router.get('/', getDocumentTypesController); // Alias for flat /api/document-types
router.get('/reminders', getExpiringDocumentsController);
router.get('/compliance-matrix', getComplianceMatrixController);
router.post('/upload', uploadBusDocumentController);
// Note: /api/buses/:id/documents is handled in busRoutes.js as a nested resource

export default router;
