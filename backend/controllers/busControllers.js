<<<<<<< HEAD
import { getAllBuses, getBusByRcPlate, getDuplicateBus, createBus, updateBus, deleteBus } from "../models/busModel.js";
=======
import { getAllBuses, getBusByRcPlate, createBus, updateBus, deleteBus } from "../models/busModel.js";
>>>>>>> ebd537dc (fixed fuel entry issue in the deisel section)

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
<<<<<<< HEAD
        const { rc_plate_number, capacity, seating_capacity, engine_no, engine_number, bus_no, purchase_date } = req.body;

        if (purchase_date && new Date(purchase_date) > new Date()) {
             return handleResponse(res, 400, false, "Purchase date cannot be in the future");
        }

        // 1. Check if bus already exists by RC Plate
=======
        const { rc_plate_number, capacity, seating_capacity, engine_no, engine_number, bus_no } = req.body;

        // 1. Check if bus already exists
>>>>>>> ebd537dc (fixed fuel entry issue in the deisel section)
        const existingBus = await getBusByRcPlate(rc_plate_number);
        if (existingBus) {
            return handleResponse(res, 400, false, "Bus with this RC Plate Number already exists");
        }

<<<<<<< HEAD
        // 2. Check for duplicate bus_no or engine_number
        if (bus_no || engine_number || engine_no) {
            const duplicate = await getDuplicateBus(bus_no, engine_number || engine_no);
            if (duplicate) {
                 if (String(duplicate.bus_no) === String(bus_no)) {
                      return handleResponse(res, 400, false, `Bus Number ${bus_no} is already assigned to RC Plate ${duplicate.rc_plate_number}`);
                 }
                 if ((engine_number || engine_no) && duplicate.engine_number === (engine_number || engine_no).trim().toUpperCase()) {
                      return handleResponse(res, 400, false, `Engine Number ${engine_number || engine_no} is already registered to RC Plate ${duplicate.rc_plate_number}`);
                 }
            }
        }

        // 3. Map fields and store
=======
        // 2. Map fields and store
>>>>>>> ebd537dc (fixed fuel entry issue in the deisel section)
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
<<<<<<< HEAD
        const { capacity, seating_capacity, engine_no, engine_number, bus_no, purchase_date } = req.body;

        if (purchase_date && new Date(purchase_date) > new Date()) {
             return handleResponse(res, 400, false, "Purchase date cannot be in the future");
        }

        if (bus_no || engine_number || engine_no) {
            const duplicate = await getDuplicateBus(bus_no, engine_number || engine_no, rc_plate_number);
            if (duplicate) {
                 if (String(duplicate.bus_no) === String(bus_no)) {
                      return handleResponse(res, 400, false, `Bus Number ${bus_no} is already assigned to RC Plate ${duplicate.rc_plate_number}`);
                 }
                 if ((engine_number || engine_no) && duplicate.engine_number === (engine_number || engine_no).trim().toUpperCase()) {
                      return handleResponse(res, 400, false, `Engine Number ${engine_number || engine_no} is already registered to RC Plate ${duplicate.rc_plate_number}`);
                 }
            }
        }

        const busData = {
            ...req.body,
            seating_capacity: seating_capacity || capacity,
=======
        const { capacity, seating_capacity, engine_no, engine_number, bus_no } = req.body;

        // Basic validation
        if (seating_capacity === undefined && capacity === undefined) {
            return handleResponse(res, 400, false, "Seating capacity is required");
        }
        
        const busData = {
            ...req.body,
            seating_capacity: seating_capacity !== undefined ? seating_capacity : capacity,
>>>>>>> ebd537dc (fixed fuel entry issue in the deisel section)
            engine_number: engine_number || engine_no,
            status: req.body.status?.toUpperCase() || 'ACTIVE'
        };

<<<<<<< HEAD
=======
        console.log("Attempting to update bus:", rc_plate_number, busData);

>>>>>>> ebd537dc (fixed fuel entry issue in the deisel section)
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
