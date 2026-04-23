import express from 'express';
import { getAllBusesController, addBusController, updateBusController, deleteBusController, getBusByRcPlateController } from '../controllers/busControllers.js';
import { getBusReadingsController, addBusReadingController, getLatestReadingController, getBusReadingByDateController } from '../controllers/readingController.js';
import { getBusSparesController, recordUsageController } from '../controllers/spareController.js';
import { getBusDieselHistoryController, addSingleBusDieselController } from '../controllers/dieselController.js';
import { getBusOilLogsController, recordOilLogController } from '../controllers/oilController.js';
import { getBusDocumentsController, uploadBusDocumentController } from '../controllers/documentController.js';

const router = express.Router();

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
router.post('/:rc_plate_number/diesel', addSingleBusDieselController);

router.get('/:rc_plate_number/oils', getBusOilLogsController);
router.post('/:rc_plate_number/oils', recordOilLogController);

router.post('/documents', uploadBusDocumentController);
router.get('/:id/documents', getBusDocumentsController);
router.post('/:id/documents', uploadBusDocumentController);

export default router;
