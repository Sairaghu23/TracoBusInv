import * as analyticsModel from '../models/analyticsModel.js';
import pool from '../config/db.js';

const handleResponse = (res, statusCode, status, message, data = null) => {
    res.status(statusCode).json({ status, message, data });
};

// GET /api/analytics/diesel?month=3&year=2026
export const getDieselAnalyticsController = async (req, res, next) => {
    try {
        const { month, year } = req.query;
        if (!month || !year) return handleResponse(res, 400, false, 'month and year are required');
        const data = await analyticsModel.getDieselAnalytics(month, year);
        handleResponse(res, 200, true, 'Diesel analytics fetched', data);
    } catch (err) {
        next(err);
    }
};

// GET /api/analytics/oils?month=3&year=2026
export const getOilAnalyticsController = async (req, res, next) => {
    try {
        const { month, year } = req.query;
        if (!month || !year) return handleResponse(res, 400, false, 'month and year are required');
        const data = await analyticsModel.getOilAnalytics(month, year);
        handleResponse(res, 200, true, 'Oil analytics fetched', data);
    } catch (err) {
        next(err);
    }
};

// GET /api/analytics/spares?month=3&year=2026
export const getSpareAnalyticsController = async (req, res, next) => {
    try {
        const { month, year } = req.query;
        if (!month || !year) return handleResponse(res, 400, false, 'month and year are required');
        const data = await analyticsModel.getSpareAnalytics(month, year);
        handleResponse(res, 200, true, 'Spare analytics fetched', data);
    } catch (err) {
        next(err);
    }
};

// GET /api/analytics/fees?semester=1
export const getFeeAnalyticsController = async (req, res, next) => {
    try {
        const { semester } = req.query;
        const data = await analyticsModel.getFeeAnalyticsByYear(semester || 1);
        handleResponse(res, 200, true, 'Fee analytics fetched', data);
    } catch (err) {
        next(err);
    }
};

// GET /api/analytics/calendar-expirations
// Merges bus document expirations + driver license expirations into one list
export const getCalendarExpirationsController = async (req, res, next) => {
    try {
        const [docsResult, driversResult] = await Promise.all([
            pool.query(`
                SELECT 
                    TO_CHAR(bd.expiry_date, 'YYYY-MM-DD') as expiry_date,
                    dt.document_name as title,
                    b.rc_plate_number as ref,
                    'document' as category
                FROM bus_documents bd
                JOIN document_types dt ON bd.document_type_id = dt.document_type_id
                JOIN buses b ON bd.bus_id = b.bus_id
                ORDER BY bd.expiry_date ASC
            `),
            pool.query(`
                SELECT 
                    TO_CHAR(license_expiry, 'YYYY-MM-DD') as expiry_date,
                    'License: ' || name as title,
                    license_number as ref,
                    'driver' as category
                FROM drivers
                WHERE license_expiry IS NOT NULL
                ORDER BY license_expiry ASC
            `)
        ]);

        const combined = [...docsResult.rows, ...driversResult.rows].sort(
            (a, b) => new Date(a.expiry_date) - new Date(b.expiry_date)
        );

        handleResponse(res, 200, true, 'Expirations fetched', combined);
    } catch (err) {
        next(err);
    }
};
