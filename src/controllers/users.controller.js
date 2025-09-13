import logger from '#config/logger.js';
import {
    getAllUsersService,
    getUserById,
    updateUser as updateUserService,
    deleteUser as deleteUserService,
} from '#services/users.service.js';
import {
    userIdSchema,
    updateUserSchema,
} from '#validations/users.validation.js';
import { formatValidationError } from '#utils/format.js';

export const fetchAllUsers = async (req, res, next) => {
    try {
        logger.info('Getting users...');

        const allUsers = await getAllUsersService();

        res.json({
            message: 'Successfully retrieved all users.',
            users: allUsers,
            count: allUsers.length,
        });
    } catch (err) {
        logger.error(err);
        next(err);
    }
};

export const fetchUserById = async (req, res, next) => {
    try {
        const validationResult = userIdSchema.safeParse(req.params);

        if (!validationResult.success) {
            return res.status(400).json({
                error: 'Validation failed',
                details: formatValidationError(validationResult.error),
            });
        }

        const { id } = validationResult.data;

        // Authorization: Users can only view their own profile, except admins
        if (req.user.role !== 'admin' && req.user.id !== id) {
            return res.status(403).json({
                error: 'Access denied. You can only view your own profile.',
            });
        }

        logger.info(`Getting user by ID: ${id}`);

        const user = await getUserById(id);

        res.json({
            message: 'Successfully retrieved user.',
            user,
        });
    } catch (err) {
        logger.error('Get user by ID error:', err);

        if (err.message === 'User not found') {
            return res.status(404).json({ error: 'User not found' });
        }

        next(err);
    }
};

export const updateUserById = async (req, res, next) => {
    try {
        const paramsValidation = userIdSchema.safeParse(req.params);
        const bodyValidation = updateUserSchema.safeParse(req.body);

        if (!paramsValidation.success) {
            return res.status(400).json({
                error: 'Invalid user ID',
                details: formatValidationError(paramsValidation.error),
            });
        }

        if (!bodyValidation.success) {
            return res.status(400).json({
                error: 'Validation failed',
                details: formatValidationError(bodyValidation.error),
            });
        }

        const { id } = paramsValidation.data;
        const updates = bodyValidation.data;

        // Authorization: Users can only update their own profile, except admins
        if (req.user.role !== 'admin' && req.user.id !== id) {
            return res.status(403).json({
                error: 'Access denied. You can only update your own profile.',
            });
        }

        // Only admins can change roles
        if (updates.role && req.user.role !== 'admin') {
            return res.status(403).json({
                error: 'Access denied. Only admins can change user roles.',
            });
        }

        logger.info(`Updating user ${id} by user ${req.user.email}`);

        const updatedUser = await updateUserService(id, updates);

        res.json({
            message: 'User updated successfully.',
            user: updatedUser,
        });
    } catch (err) {
        logger.error('Update user error:', err);

        if (err.message === 'User not found') {
            return res.status(404).json({ error: 'User not found' });
        }

        next(err);
    }
};

export const deleteUserById = async (req, res, next) => {
    try {
        const validationResult = userIdSchema.safeParse(req.params);

        if (!validationResult.success) {
            return res.status(400).json({
                error: 'Validation failed',
                details: formatValidationError(validationResult.error),
            });
        }

        const { id } = validationResult.data;

        // Authorization: Users can only delete their own profile, except admins
        if (req.user.role !== 'admin' && req.user.id !== id) {
            return res.status(403).json({
                error: 'Access denied. You can only delete your own profile.',
            });
        }

        logger.info(`Deleting user ${id} by user ${req.user.email}`);

        const result = await deleteUserService(id);

        res.json({
            message: result.message,
            deletedUser: result.deletedUser,
        });
    } catch (err) {
        logger.error('Delete user error:', err);

        if (err.message === 'User not found') {
            return res.status(404).json({ error: 'User not found' });
        }

        next(err);
    }
};
