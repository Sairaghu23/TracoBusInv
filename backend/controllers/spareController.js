import * as spareModel from '../models/spareModel.js';

const handleResponse = (res, statusCode, status, message, data = null) => {
    res.status(statusCode).json({ status, message, data });
};

// --- STOCKS ---

export const getStocksController = async (req, res, next) => {
    try {
        const stocks = await spareModel.getAllStocks();
        handleResponse(res, 200, true, "Stocks retrieved successfully", stocks);
    } catch (err) {
        next(err);
    }
};

export const addSpareTypeController = async (req, res, next) => {
    try {
        const { spare_name } = req.body;
        const newType = await spareModel.addSpareType(spare_name);
        handleResponse(res, 201, true, "New spare part type registered", newType);
    } catch (err) {
        next(err);
    }
};

// --- PURCHASES ---

export const recordPurchaseController = async (req, res, next) => {
    try {
        const purchase = await spareModel.recordPurchase(req.body);
        handleResponse(res, 201, true, "Purchase recorded and stock updated", purchase);
    } catch (err) {
        next(err);
    }
};

// --- USAGE ---

export const getBusSparesController = async (req, res, next) => {
    try {
        const { rc_plate_number } = req.params;
        const usage = await spareModel.getUsageByBus(rc_plate_number);
        handleResponse(res, 200, true, "Bus spare usage history retrieved", usage);
    } catch (err) {
        next(err);
    }
};

export const recordUsageController = async (req, res, next) => {
    try {
        const { rc_plate_number } = req.params;
        const usageData = { ...req.body, rc_plate_number };
        const usage = await spareModel.recordUsage(usageData);
        handleResponse(res, 201, true, "Replacement recorded and stock deducted", usage);
    } catch (err) {
        if (err.message === 'Insufficient stock for this spare part.') {
            return res.status(400).json({ status: false, message: err.message });
        }
        next(err);
    }
};

// --- PURCHASE LOGS ---

export const getSparePurchasesController = async (req, res, next) => {
    try {
        const { spare_id } = req.params;
        const purchases = await spareModel.getPurchasesBySpare(spare_id);
        handleResponse(res, 200, true, "Purchase history retrieved successfully", purchases);
    } catch (err) {
        next(err);
    }
};

// --- INVENTORY / CODES ---

export const getInventoryController = async (req, res, next) => {
    try {
        const { spare_id } = req.params;
        const { status } = req.query; // AVAILABLE, USED, ALL
        const inventory = await spareModel.getInventoryBySpare(spare_id, status);
        handleResponse(res, 200, true, "Inventory retrieved", inventory);
    } catch (err) {
        next(err);
    }
};

export const getPurchaseCodesController = async (req, res, next) => {
    try {
        const { purchase_id } = req.params;
        const codes = await spareModel.getProductCodesByPurchase(purchase_id);
        handleResponse(res, 200, true, "Purchase codes retrieved", codes);
    } catch (err) {
        next(err);
    }
};

export const getUsageCodesController = async (req, res, next) => {
    try {
        const { usage_id } = req.params;
        const codes = await spareModel.getProductCodesByUsage(usage_id);
        handleResponse(res, 200, true, "Usage codes retrieved", codes);
    } catch (err) {
        next(err);
    }
};

export const getCostPerUnitController = async (req, res, next) => {
    try {
        const { spare_id } = req.params;
        const cost = await spareModel.getCostPerUnit(spare_id);
        handleResponse(res, 200, true, "Cost data retrieved", cost);
    } catch (err) {
        next(err);
    }
};
