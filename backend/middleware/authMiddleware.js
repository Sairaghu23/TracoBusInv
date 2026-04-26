import jwt from 'jsonwebtoken';

const authMiddleware = (req, res, next) => {
    // Skip auth for public static files if they fall through to here
    if (req.path.startsWith('/uploads') || req.path.startsWith('/api/uploads')) {
        return next();
    }

    // Get token from header
    const authHeader = req.header('Authorization');
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    // Check if no token
    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    // Verify token
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_fallback_secret');
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};

export default authMiddleware;
