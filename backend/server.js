import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Import central API router
import apiRouter from './routes/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Global Error Handlers to prevent silent crashes
process.on('uncaughtException', (err) => {
    console.error('CRITICAL: Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('CRITICAL: Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('SIGINT', () => {
    console.log('Received SIGINT. Shutting down...');
    process.exit(0);
});

app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Serve static files for uploaded documents under /api to ensure proxy routing consistency
app.use('/api/uploads', express.static(path.join(__dirname, '../uploads')));

// Use centralized API router
app.use('/api', apiRouter);

// Error Handling Middleware
app.use((err, req, res, next) => {
    console.error("SERVER ERROR:", err.message);
    console.error(err.stack);
    if (!res.headersSent) {
        res.status(500).json({ status: false, message: 'Internal Server Error' });
    }
});

const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`ERROR: Port ${PORT} is already in use.`);
        process.exit(1);
    } else {
        console.error('SERVER ERROR:', err);
    }
});
