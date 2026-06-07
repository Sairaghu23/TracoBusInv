import express from 'express';
import { getAllBusesController, addBusController, updateBusController, deleteBusController, getBusByRcPlateController } from '../controllers/busControllers.js';
import { getBusReadingsController, addBusReadingController, getLatestReadingController, getBusReadingByDateController } from '../controllers/readingController.js';
import { getBusSparesController, recordUsageController } from '../controllers/spareController.js';
<<<<<<< HEAD
import { getBusDieselHistoryController, addSingleBusDieselController } from '../controllers/dieselController.js';
import { getBusOilLogsController, recordOilLogController } from '../controllers/oilController.js';
import { getBusDocumentsController, uploadBusDocumentController } from '../controllers/documentController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply auth protection to all bus routes
router.use(authMiddleware);

=======
import { getBusDieselHistoryController } from '../controllers/dieselController.js';
import { getBusOilLogsController, recordOilLogController } from '../controllers/oilController.js';
import { getBusDocumentsController } from '../controllers/documentController.js';

const router = express.Router();

>>>>>>> ebd537dc (fixed fuel entry issue in the deisel section)
router.get('/', getAllBusesController);
router.get('/:rc_plate_number', getBusByRcPlateController);
router.post('/', addBusController);
router.put('/:rc_plate_number', updateBusController);
router.delete('/:rc_plate_number', deleteBusController);

// Nested/Related resources for a specific bus
router.get('/:rc_plate_number/readings', getBusReadingsController);
router.get('/:rc_plate_number/readings/latest', getLatestReadingController);
router.get('/:rc_plate_number/readings/date/:date', getBusReadingByDateController);
router.post('/:rc_plate_number/readings', addBusReadingController);

router.get('/:rc_plate_number/spares', getBusSparesController);
router.post('/:rc_plate_number/spares', recordUsageController);

router.get('/:rc_plate_number/diesel', getBusDieselHistoryController);
<<<<<<< HEAD
router.post('/:rc_plate_number/diesel', addSingleBusDieselController);
=======
>>>>>>> ebd537dc (fixed fuel entry issue in the deisel section)

router.get('/:rc_plate_number/oils', getBusOilLogsController);
router.post('/:rc_plate_number/oils', recordOilLogController);

<<<<<<< HEAD
router.post('/documents', uploadBusDocumentController);
router.get('/:id/documents', getBusDocumentsController);
router.post('/:id/documents', uploadBusDocumentController);
=======
router.get('/:id/documents', getBusDocumentsController);
>>>>>>> ebd537dc (fixed fuel entry issue in the deisel section)

export default router;
