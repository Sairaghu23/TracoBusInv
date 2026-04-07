import { dieselModel } from '../models/dieselModel.js';

export const getFuelRateController = async (req, res) => {
    try {
        const { date } = req.params;
        const rate = await dieselModel.getFuelRate(date);
        res.json({ status: true, data: rate });
    } catch (err) {
        res.status(500).json({ status: false, message: err.message });
    }
};

export const updateFuelRateController = async (req, res) => {
    try {
        const { date, rate } = req.body;
        const updated = await dieselModel.upsertFuelRate(date, rate);
        res.json({ status: true, data: updated, message: "Rate updated successfully" });
    } catch (err) {
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
        res.status(500).json({ status: false, message: err.message });
    }
};

export const saveBulkDieselController = async (req, res) => {
    try {
        const { logs } = req.body; // Array of { bus_id, rc_plate_number, reading_id, rate_id, liters, date }
        const result = await dieselModel.addBulkDieselLogs(logs);
        res.json({ status: true, data: result, message: "Diesel logs saved successfully" });
    } catch (err) {
        res.status(500).json({ status: false, message: err.message });
    }
};

export const getDieselReportController = async (req, res) => {
    try {
        const { date } = req.params;
        const report = await dieselModel.getDieselReport(date);
        res.json({ status: true, data: report });
    } catch (err) {
        res.status(500).json({ status: false, message: err.message });
    }
};

export const getBusDieselHistoryController = async (req, res) => {
    try {
        const { rc_plate_number } = req.params;
        const history = await dieselModel.getDieselHistoryByBus(rc_plate_number);
        res.json({ status: true, data: history });
    } catch (err) {
        res.status(500).json({ status: false, message: err.message });
    }
};
