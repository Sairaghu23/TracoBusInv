import * as driverModel from '../models/driverModel.js';

// Get all drivers controller
export const getAllDriversController = async (req, res) => {
    try {
        const drivers = await driverModel.getAllDrivers();
        res.status(200).json({ status: true, data: drivers });
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
};

// Get driver by ID controller
export const getDriverByIdController = async (req, res) => {
    const { id } = req.params;
    try {
        const driver = await driverModel.getDriverById(id);
        if (!driver) return res.status(404).json({ status: false, message: 'Driver not found' });
        res.status(200).json({ status: true, data: driver });
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
};

// Add a new driver controller
export const addDriverController = async (req, res) => {
    try {
        const newDriver = await driverModel.createDriver(req.body);
        res.status(201).json({ status: true, data: newDriver });
    } catch (error) {
<<<<<<< HEAD
=======
        console.error("Error in addDriverController:", error);
        if (error.code === '23505') {
            return res.status(400).json({ status: false, message: "A driver with this license number already exists." });
        }
>>>>>>> ebd537dc (fixed fuel entry issue in the deisel section)
        res.status(500).json({ status: false, message: error.message });
    }
};

// Update driver details controller
export const updateDriverController = async (req, res) => {
    const { id } = req.params;
    try {
        const updatedDriver = await driverModel.updateDriver(id, req.body);
        if (!updatedDriver) return res.status(404).json({ status: false, message: 'Driver not found' });
        res.status(200).json({ status: true, data: updatedDriver });
    } catch (error) {
<<<<<<< HEAD
=======
        console.error("Error in updateDriverController:", error);
        if (error.code === '23505') {
            return res.status(400).json({ status: false, message: "A driver with this license number already exists." });
        }
>>>>>>> ebd537dc (fixed fuel entry issue in the deisel section)
        res.status(500).json({ status: false, message: error.message });
    }
};

// Delete driver record controller
export const deleteDriverController = async (req, res) => {
    const { id } = req.params;
    try {
        const deletedDriver = await driverModel.deleteDriver(id);
        if (!deletedDriver) return res.status(404).json({ status: false, message: 'Driver not found' });
        res.status(200).json({ status: true, message: 'Driver deleted successfully' });
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
};
