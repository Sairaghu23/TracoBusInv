import * as driverModel from '../models/driverModel.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DRIVERS_PHOTO_DIR = path.resolve(__dirname, '..', '..', 'driversphoto');

// Configure multer storage for driver photos
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        if (!fs.existsSync(DRIVERS_PHOTO_DIR)) {
            fs.mkdirSync(DRIVERS_PHOTO_DIR, { recursive: true });
        }
        cb(null, DRIVERS_PHOTO_DIR);
    },
    filename: function (req, file, cb) {
        const driverId = req.params.id || 'driver';
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const namePart = path.parse(file.originalname).name
            .replace(/[^a-z0-9]/gi, '_')
            .substring(0, 20);
        const finalName = `${driverId}-${namePart}-${uniqueSuffix}${path.extname(file.originalname)}`;
        cb(null, finalName);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
}).single('photo');

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
        console.error("Error in addDriverController:", error);
        if (error.code === '23505') {
            return res.status(400).json({ status: false, message: "A driver with this license number already exists." });
        }
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
        console.error("Error in updateDriverController:", error);
        if (error.code === '23505') {
            return res.status(400).json({ status: false, message: "A driver with this license number already exists." });
        }
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

// Upload driver photo controller
export const uploadDriverPhotoController = (req, res, next) => {
    upload(req, res, async function (err) {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({ status: false, message: `Multer Error: ${err.message}` });
        } else if (err) {
            return res.status(400).json({ status: false, message: err.message });
        }

        try {
            const { id } = req.params;
            if (!req.file) {
                return res.status(400).json({ status: false, message: 'Photo file is required' });
            }

            const photoPath = `/api/driversphoto/${req.file.filename}`;
            
            // Get current driver to see if they already have a photo, and delete the old file if so
            const currentDriver = await driverModel.getDriverById(id);
            if (currentDriver && currentDriver.photo_url) {
                const oldFilename = path.basename(currentDriver.photo_url);
                const oldFilePath = path.join(DRIVERS_PHOTO_DIR, oldFilename);
                if (fs.existsSync(oldFilePath)) {
                    fs.unlinkSync(oldFilePath);
                }
            }

            // Update in DB
            const updatedDriver = await driverModel.updateDriver(id, {
                ...currentDriver,
                photo_url: photoPath
            });

            res.status(200).json({ status: true, data: updatedDriver, message: "Photo uploaded successfully" });
        } catch (error) {
            if (req.file) {
                fs.unlinkSync(req.file.path);
            }
            next(error);
        }
    });
};
