import * as oilModel from '../models/oilModel.js';

const handleResponse = (res, statusCode, status, message, data = null) => {
    res.status(statusCode).json({ status, message, data });
};

// GET /api/oils/types
export const getOilTypesController = async (req, res, next) => {
    try {
        const types = await oilModel.getAllOilTypes();
        handleResponse(res, 200, true, 'Oil types fetched successfully', types);
    } catch (err) {
        next(err);
    }
};

// GET /api/buses/:rc_plate_number/oils
export const getBusOilLogsController = async (req, res, next) => {
    try {
        const { rc_plate_number } = req.params;
        const logs = await oilModel.getOilLogsByBus(rc_plate_number);
        handleResponse(res, 200, true, 'Oil logs fetched successfully', logs);
    } catch (err) {
        next(err);
    }
};

// POST /api/buses/:rc_plate_number/oils
export const recordOilLogController = async (req, res, next) => {
    try {
        const { rc_plate_number } = req.params;
        const log = await oilModel.recordOilLog({ ...req.body, rc_plate_number });
        handleResponse(res, 201, true, 'Oil log recorded successfully', log);
    } catch (err) {
        next(err);
    }
};
