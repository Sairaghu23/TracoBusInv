import { 
    getReadingsByBus, 
    addReading, 
    getLatestReading, 
    getAllFleetReadings, 
    getFleetReadingsByDate,
    getRecentFleetReadings,
    addBulkReadings, 
    getReadingByDate,
    deleteReading
} from '../models/readingModel.js';
import { getBusByRcPlate } from '../models/busModel.js';

const handleResponse = (res, statusCode, status, message, data = null) => {
    res.status(statusCode).json({
        status,
        message,
        data
    });
};

// Controller to get readings for a bus
export const getBusReadingsController = async (req, res, next) => {
    try {
        const { rc_plate_number } = req.params;
        const readings = await getReadingsByBus(rc_plate_number);
        handleResponse(res, 200, true, "Readings retrieved successfully", readings);
    } catch (err) {
        next(err);
    }
};

// Controller to add a reading for a bus
export const addBusReadingController = async (req, res, next) => {
    try {
        const { rc_plate_number } = req.params;
        const { trip_start_date, trip_end_date, old_reading, new_reading } = req.body;
        
        const bus = await getBusByRcPlate(rc_plate_number);
        if (!bus) {
            return handleResponse(res, 404, false, "Bus not found");
        }


        const readingData = {
            bus_id: bus.bus_id,
            start_date: trip_start_date,
            end_date: trip_end_date,
            old_reading,
            new_reading
        };
        
        const newReading = await addReading(readingData);
        handleResponse(res, 201, true, "Trip reading logged successfully", newReading);
    } catch (err) {
        next(err);
    }
};

// Controller to get the latest reading (for pre-filling form)
export const getLatestReadingController = async (req, res, next) => {
    try {
        const { rc_plate_number } = req.params;
        const latest = await getLatestReading(rc_plate_number);
        handleResponse(res, 200, true, "Latest reading retrieved", latest);
    } catch (err) {
        next(err);
    }
};

export const getBusReadingByDateController = async (req, res, next) => {
    try {
        const { rc_plate_number, date } = req.params;
        const reading = await getReadingByDate(rc_plate_number, date);
        if (reading) {
            handleResponse(res, 200, true, "Reading found", reading);
        } else {
            handleResponse(res, 200, true, "No reading found for this date", null);
        }
    } catch (err) {
        next(err);
    }
};

// --- BULK ENTRY SYSTEM CONTROLLERS ---

export const getAllFleetReadingsController = async (req, res, next) => {
    try {
        const readings = await getAllFleetReadings();
        handleResponse(res, 200, true, "Fleet readings retrieved", readings);
    } catch (err) {
        next(err);
    }
};

export const getFleetReadingsByDateController = async (req, res, next) => {
    try {
        const { date } = req.params;
        const readings = await getFleetReadingsByDate(date);
        handleResponse(res, 200, true, `Fleet readings for ${date} retrieved`, readings);
    } catch (err) {
        next(err);
    }
};

export const getRecentFleetReadingsController = async (req, res, next) => {
    try {
        const limit = parseInt(req.query.limit) || 25;
        const readings = await getRecentFleetReadings(limit);
        handleResponse(res, 200, true, "Recent fleet readings retrieved", readings);
    } catch (err) {
        next(err);
    }
};

export const addBulkReadingsController = async (req, res, next) => {
    try {
        const { readings } = req.body; // Expects array of reading objects

        const results = await addBulkReadings(readings);
        handleResponse(res, 201, true, `${results.length} readings logged successfully`, results);
    } catch (err) {
        next(err);
    }
};

// Delete reading controller
export const deleteReadingController = async (req, res, next) => {
    try {
        const { reading_id } = req.params;
        const deleted = await deleteReading(reading_id);
        if (!deleted) {
            return handleResponse(res, 404, false, "Reading record not found or already deleted");
        }
        handleResponse(res, 200, true, "Odometer reading deleted successfully", deleted);
    } catch (err) {
        next(err);
    }
};
