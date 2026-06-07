import { getAllBuses, getBusByRcPlate, createBus, updateBus, deleteBus } from "../models/busModel.js";

const handleResponse = (res, statusCode, status, message, data = null) => {
    res.status(statusCode).json({
        status,
        message,
        data
    });
};

// Controller to get all buses
export const getAllBusesController = async (req, res, next) => {
    try {
        const buses = await getAllBuses();
        handleResponse(res, 200, true, "Buses retrieved successfully", buses);
    } catch (err) {
        next(err);
    }
};

// Controller to get a single bus
export const getBusByRcPlateController = async (req, res, next) => {
    try {
        const { rc_plate_number } = req.params;
        const bus = await getBusByRcPlate(rc_plate_number);
        if (!bus) {
            return handleResponse(res, 404, false, "Bus not found");
        }
        handleResponse(res, 200, true, "Bus retrieved successfully", bus);
    } catch (err) {
        next(err);
    }
};

// Controller to add a new bus
export const addBusController = async (req, res, next) => {
    try {
        const { rc_plate_number, capacity, seating_capacity, engine_no, engine_number, bus_no } = req.body;

        // 1. Check if bus already exists
        const existingBus = await getBusByRcPlate(rc_plate_number);
        if (existingBus) {
            return handleResponse(res, 400, false, "Bus with this RC Plate Number already exists");
        }

        // 2. Map fields and store
        const busToCreate = {
            ...req.body,
            seating_capacity: seating_capacity || capacity, // Support both during transition
            engine_number: engine_number || engine_no,
            status: req.body.status?.toUpperCase() || 'ACTIVE'
        };
        
        const newBus = await createBus(busToCreate);
        handleResponse(res, 201, true, "Bus registered successfully", newBus);
    } catch (err) {
        console.error("Error in addBusController:", err);
        next(err);
    }
};

// Controller to update a bus
export const updateBusController = async (req, res, next) => {
    try {
        const { rc_plate_number } = req.params;
        const { capacity, seating_capacity, engine_no, engine_number, bus_no } = req.body;

        // Basic validation
        if (seating_capacity === undefined && capacity === undefined) {
            return handleResponse(res, 400, false, "Seating capacity is required");
        }
        
        const busData = {
            ...req.body,
            seating_capacity: seating_capacity !== undefined ? seating_capacity : capacity,
            engine_number: engine_number || engine_no,
            status: req.body.status?.toUpperCase() || 'ACTIVE'
        };

        console.log("Attempting to update bus:", rc_plate_number, busData);

        const updatedBus = await updateBus(rc_plate_number, busData);
        if (!updatedBus) {
            return handleResponse(res, 404, false, "Bus not found");
        }
        handleResponse(res, 200, true, "Bus updated successfully", updatedBus);
    } catch (err) {
        console.error("Error in updateBusController:", err);
        next(err);
    }
};

// Controller to delete a bus
export const deleteBusController = async (req, res, next) => {
    try {
        const { rc_plate_number } = req.params;
        const deletedBus = await deleteBus(rc_plate_number);
        if (!deletedBus) {
            return handleResponse(res, 404, false, "Bus not found");
        }
        handleResponse(res, 200, true, "Bus deleted successfully");
    } catch (err) {
        next(err);
    }
};
