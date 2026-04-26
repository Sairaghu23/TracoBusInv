import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { getDocumentTypes, getBusDocuments, createBusDocument, getExpiringDocumentsInfo, getComplianceMatrix } from '../models/documentModel.js';

// Configure multer storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = 'uploads';
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        // Fallback to 'BUS' if bus_id is not yet available in req.body
        const busId = req.body.bus_id || 'BUS';
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        
        // Sanitize original filename (remove special chars/spaces)
        const namePart = path.parse(file.originalname).name
            .replace(/[^a-z0-9]/gi, '_')
            .substring(0, 20); // Limit length
            
        const finalName = `${busId}-${namePart}-${uniqueSuffix}${path.extname(file.originalname)}`;
        cb(null, finalName);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed!'), false);
        }
    }
}).single('document'); // Expect a single file in the 'document' field

const handleResponse = (res, statusCode, message, data = null) => {
    res.status(statusCode).json({
        status: true,
        message,
        data
    });
};

export const getDocumentTypesController = async (req, res, next) => {
    try {
        const types = await getDocumentTypes();
        handleResponse(res, 200, "Document types fetched successfully", types);
    } catch (err) {
        next(err);
    }
};

export const getBusDocumentsController = async (req, res, next) => {
    try {
        const { id } = req.params;
        const docs = await getBusDocuments(id);
        handleResponse(res, 200, "Bus documents fetched successfully", docs);
    } catch (err) {
        next(err);
    }
};

export const uploadBusDocumentController = (req, res, next) => {
    upload(req, res, async function (err) {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({ status: false, message: `Multer Error: ${err.message}` });
        } else if (err) {
            return res.status(400).json({ status: false, message: err.message });
        }

        try {
            const { bus_id: rc_plate_number, document_type_id, start_date, expiry_date, provider } = req.body;
            
            if (!req.file) {
                return res.status(400).json({ status: false, message: 'PDF document is required' });
            }
            if (!rc_plate_number || !document_type_id || !start_date || !expiry_date) {
                // Remove uploaded file if validation fails
                fs.unlinkSync(req.file.path);
                return res.status(400).json({ status: false, message: 'All fields except provider are required' });
            }

            const filePath = `/api/uploads/${req.file.filename}`;
            const newDoc = await createBusDocument(rc_plate_number, document_type_id, filePath, start_date, expiry_date, provider);
            
            handleResponse(res, 201, "Document uploaded successfully", newDoc);
        } catch (error) {
            if (req.file) {
                fs.unlinkSync(req.file.path);
            }
            next(error);
        }
    });
};

export const getExpiringDocumentsController = async (req, res, next) => {
    try {
        const days = parseInt(req.query.days) || 30;
        const docs = await getExpiringDocumentsInfo(days);
        handleResponse(res, 200, "Expiring documents fetched successfully", docs);
    } catch (err) {
        next(err);
    }
};
export const getComplianceMatrixController = async (req, res, next) => {
    try {
        const matrix = await getComplianceMatrix();
        handleResponse(res, 200, "Compliance matrix fetched successfully", matrix);
    } catch (err) {
        next(err);
    }
};
