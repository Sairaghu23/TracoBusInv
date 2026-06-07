<<<<<<< HEAD
import { getAllRoutesWithStops, createRoute, updateRouteName, deleteRouteById } from "../models/routeModel.js";
import { createStoppingWithFee, updateStop, deleteStoppingById } from "../models/stoppingModel.js";
=======
import { getAllRoutesWithStops, createRoute, updateRouteName } from "../models/routeModel.js";
import { createStoppingWithFee, updateStop } from "../models/stoppingModel.js";
>>>>>>> ebd537dc (fixed fuel entry issue in the deisel section)

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
<<<<<<< HEAD

        if (!route_name) {
            return res.status(400).json({ status: false, message: "Route name is required" });
        }

=======
        
        if (!route_name) {
            return res.status(400).json({ status: false, message: "Route name is required" });
        }
        
>>>>>>> ebd537dc (fixed fuel entry issue in the deisel section)
        const newRoute = await createRoute(route_name);
        handleResponse(res, 201, "Route created successfully", newRoute);
    } catch (err) {
        console.error("FATAL ERROR in addRouteController:", err);
<<<<<<< HEAD

        // Check for duplicate
        const isDuplicate = err.code === '23505' ||
            err.message?.toLowerCase().includes('unique') ||
            err.message?.toLowerCase().includes('already exists');

=======
        
        // Check for duplicate
        const isDuplicate = err.code === '23505' || 
                           err.message?.toLowerCase().includes('unique') || 
                           err.message?.toLowerCase().includes('already exists');
        
>>>>>>> ebd537dc (fixed fuel entry issue in the deisel section)
        if (isDuplicate) {
            return res.status(409).json({ status: false, message: "ROUTE ALREADY EXISTS" });
        }

        // Send actual error message to client for debugging
<<<<<<< HEAD
        res.status(500).json({
            status: false,
            message: `SERVER ERROR: ${err.message}`,
=======
        res.status(500).json({ 
            status: false, 
            message: `SERVER ERROR: ${err.message}`, 
>>>>>>> ebd537dc (fixed fuel entry issue in the deisel section)
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

<<<<<<< HEAD
export const deleteRouteController = async (req, res, next) => {
    try {
        const { route_id } = req.params;
        const deleted = await deleteRouteById(route_id);
        if (!deleted) return res.status(404).json({ status: false, message: "Route not found" });
        handleResponse(res, 200, "Route deleted successfully", deleted);
    } catch (err) {
        next(err);
    }
};

=======
>>>>>>> ebd537dc (fixed fuel entry issue in the deisel section)
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
<<<<<<< HEAD

export const deleteStopController = async (req, res, next) => {
    try {
        const { stop_id } = req.params;
        const deleted = await deleteStoppingById(stop_id);
        if (!deleted) return res.status(404).json({ status: false, message: "Stop not found" });
        handleResponse(res, 200, "Stopping point deleted successfully", deleted);
    } catch (err) {
        next(err);
    }
};
=======
>>>>>>> ebd537dc (fixed fuel entry issue in the deisel section)
