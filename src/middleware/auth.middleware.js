import {jwttoken} from '#utils/jwt.js';
import logger from '#config/logger.js';

export const authenticateToken = (req, res, next) => {
    try {
        // Get token from cookies or Authorization header
        const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ error: 'Access token is required' });
        }

        // Verify token
        const decoded = jwttoken.verify(token);
        req.user = decoded; // Add user info to request
        
        logger.info(`User ${decoded.email} authenticated successfully`);
        next();
    } catch (err) {
        logger.error('Authentication failed:', err);
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};

export const requireRole = (requiredRole) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        if (req.user.role !== requiredRole) {
            return res.status(403).json({ error: `Access denied. ${requiredRole} role required` });
        }

        next();
    };
};