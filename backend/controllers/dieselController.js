import { dieselModel } from '../models/dieselModel.js';

export const getFuelRateController = async (req, res) => {
    try {
        const { date } = req.params;
        const rate = await dieselModel.getFuelRate(date);
        res.json({ status: true, data: rate });
    } catch (err) {
        console.error("Error in getFuelRateController:", err);
        res.status(500).json({ status: false, message: err.message });
    }
};

export const updateFuelRateController = async (req, res) => {
    try {
        const { date, rate } = req.body;
        const updated = await dieselModel.upsertFuelRate(date, rate);
        res.json({ status: true, data: updated, message: "Rate updated successfully" });
    } catch (err) {
        console.error("Error in updateFuelRateController:", err);
        res.status(500).json({ status: false, message: err.message });
    }
};

export const validateOdometerStatusController = async (req, res) => {
    try {
        const { date } = req.params;
        const missing = await dieselModel.checkOdometerStatus(date);
        if (missing.length > 0) {
            return res.json({ 
                status: false, 
                missing: true, 
                data: missing, 
                message: `${missing.length} buses are missing odometer readings for this date.` 
            });
        }
        
        // If everything is okay, return the reading_ids for entry
        const readings = await dieselModel.getReadingsForDieselEntry(date);
        res.json({ status: true, missing: false, data: readings });
    } catch (err) {
        console.error("Error in validateOdometerStatusController:", err);
        res.status(500).json({ status: false, message: err.message });
    }
};

export const saveBulkDieselController = async (req, res) => {
    try {
        const { logs } = req.body; // Array of { bus_id, rc_plate_number, reading_id, rate_id, liters, date }
        
        // Validate no future dates
        const futureDate = logs.find(l => new Date(l.date) > new Date());
        if (futureDate) {
            return res.status(400).json({ status: false, message: "Cannot log diesel for future dates" });
        }

        const result = await dieselModel.addBulkDieselLogs(logs);
        res.json({ status: true, data: result, message: "Diesel logs saved successfully" });
    } catch (err) {
        console.error("Error in saveBulkDieselController:", err);
        res.status(500).json({ status: false, message: err.message });
    }
};

export const getDieselReportController = async (req, res) => {
    try {
        const { date } = req.params;
        const report = await dieselModel.getDieselReport(date);
        res.json({ status: true, data: report });
    } catch (err) {
        console.error("Error in getDieselReportController:", err);
        res.status(500).json({ status: false, message: err.message });
    }
};

export const getBusDieselHistoryController = async (req, res) => {
    try {
        const { rc_plate_number } = req.params;
        const history = await dieselModel.getDieselHistoryByBus(rc_plate_number);
        res.json({ status: true, data: history });
    } catch (err) {
        console.error("Error in getBusDieselHistoryController:", err);
        res.status(500).json({ status: false, message: err.message });
    }
};

export const addSingleBusDieselController = async (req, res) => {
    try {
        const { rc_plate_number } = req.params;
        const result = await dieselModel.addSingleDieselLog({ ...req.body, rc_plate_number });
        res.json({ status: true, data: result, message: "Diesel log saved successfully" });
    } catch (err) {
        console.error("Error in addSingleBusDieselController:", err);
        res.status(500).json({ status: false, message: err.message });
    }
};
