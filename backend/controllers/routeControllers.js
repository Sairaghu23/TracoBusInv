import { getAllRoutesWithStops, createRoute, updateRouteName } from "../models/routeModel.js";
import { createStoppingWithFee, updateStop } from "../models/stoppingModel.js";

const handleResponse = (res, statusCode, message, data = null) => {
    res.status(statusCode).json({
        status: true,
        message,
        data
    });
}

export const getAllRoutesController = async (req, res, next) => {
    try {
        const routes = await getAllRoutesWithStops();
        handleResponse(res, 200, "Routes with stops retrieved successfully", routes);
    } catch (err) {
        next(err);
    }
};

export const addRouteController = async (req, res, next) => {
    try {
        const { route_name } = req.body;
        console.log("POST /api/routes - Received:", route_name);
        
        if (!route_name) {
            return res.status(400).json({ status: false, message: "Route name is required" });
        }
        
        const newRoute = await createRoute(route_name);
        handleResponse(res, 201, "Route created successfully", newRoute);
    } catch (err) {
        console.error("FATAL ERROR in addRouteController:", err);
        
        // Check for duplicate
        const isDuplicate = err.code === '23505' || 
                           err.message?.toLowerCase().includes('unique') || 
                           err.message?.toLowerCase().includes('already exists');
        
        if (isDuplicate) {
            return res.status(409).json({ status: false, message: "ROUTE ALREADY EXISTS" });
        }

        // Send actual error message to client for debugging
        res.status(500).json({ 
            status: false, 
            message: `SERVER ERROR: ${err.message}`, 
            code: err.code,
            detail: err.detail
        });
    }
};

export const updateRouteController = async (req, res, next) => {
    try {
        const { route_id } = req.params;
        const { route_name } = req.body;
        if (!route_name) return res.status(400).json({ status: false, message: 'Route name is required' });
        const updated = await updateRouteName(route_id, route_name);
        handleResponse(res, 200, 'Route updated successfully', updated);
    } catch (err) {
        next(err);
    }
};

export const updateStopController = async (req, res, next) => {
    try {
        const { stop_id } = req.params;
        const { stop_name, fee } = req.body;
        if (!stop_name || fee === undefined) return res.status(400).json({ status: false, message: 'stop_name and fee are required' });
        const updated = await updateStop(stop_id, stop_name, fee);
        handleResponse(res, 200, 'Stop updated successfully', updated);
    } catch (err) {
        next(err);
    }
};
