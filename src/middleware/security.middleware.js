import aj from '#config/arcjet.js';
import { slidingWindow } from '@arcjet/node';
import logger from '#config/logger.js';

const securityMiddleware = async (req, res, next) => {
    try {
        const role = req.user?.role || 'guest';

        let limit;
        let message;

        switch (role) {
            case 'admin':
                limit = 20;
                message =
                    'Admin request limit exceeded (20 per minute). Slow down.';
                break;
            case 'user':
                limit = 10;
                message =
                    'User request limit exceeded (10 per minute). Slow down.';
                break;
            case 'guest':
                // eslint-disable-next-line no-unused-vars
                limit = 5;
                message =
                    'Guest request limit exceeded (5 per minute). Slow down.';
                break;
        }

        // const client = aj.withRule(slidingWindow({mode: 'LIVE', interval: '1m', max: limit, name: `${role}-rate-limit`}));
        const clients = {
            admin: aj.withRule(
                slidingWindow({
                    mode: 'LIVE',
                    interval: '1m',
                    max: 20,
                    name: 'admin-rate-limit',
                })
            ),
            user: aj.withRule(
                slidingWindow({
                    mode: 'LIVE',
                    interval: '1m',
                    max: 10,
                    name: 'user-rate-limit',
                })
            ),
            guest: aj.withRule(
                slidingWindow({
                    mode: 'LIVE',
                    interval: '1m',
                    max: 5,
                    name: 'guest-rate-limit',
                })
            ),
        };
        const client = clients[role] || clients.guest;

        const decision = await client.protect(req);

        if (decision.isDenied() && decision.reason.isBot()) {
            logger.warn('Bot request blocked', {
                id: req.ip,
                userAgent: req.get('User-Agent'),
                path: req.path,
                role,
            });

            return res
                .status(403)
                .json({ error: 'Automated requests are not allowed', message });
        }

        if (decision.isDenied() && decision.reason.isShield()) {
            logger.warn('Shield blocked request', {
                id: req.ip,
                userAgent: req.get('User-Agent'),
                path: req.path,
                method: req.method,
            });

            return res
                .status(403)
                .json({ error: 'Request blocked by security policy', message });
        }

        if (decision.isDenied() && decision.reason.isRateLimit()) {
            logger.warn('Rate limit exceeded', {
                id: req.ip,
                userAgent: req.get('User-Agent'),
                path: req.path,
            });

            return res
                .status(429)
                .json({ error: 'Too many requests', message });
        }

        if (!decision) {
            logger.error('Arcjet returned no decision', { role, id: req.ip });
            return res.status(500).json({ error: 'Internal server error' });
        }

        next();
    } catch (err) {
        console.error('Arcjet middleware error:', err);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Something went wrong with security middleware',
        });
    }
};

export default securityMiddleware;
