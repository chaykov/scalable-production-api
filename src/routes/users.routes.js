import express from 'express';
import {
    fetchAllUsers,
    fetchUserById,
    updateUserById,
    deleteUserById,
} from '#controllers/users.controller.js';
import { authenticateToken, requireRole } from '#middleware/auth.middleware.js';

const router = express.Router();

// GET /users - Get all users (admin only)
router.get('/', authenticateToken, requireRole('admin'), fetchAllUsers);

// GET /users/:id - Get user by ID (authenticated users can get their own profile, admins can get any)
router.get('/:id', authenticateToken, fetchUserById);

// PUT /users/:id - Update user by ID (users can update their own profile, admins can update any)
router.put('/:id', authenticateToken, updateUserById);

// DELETE /users/:id - Delete user by ID (users can delete their own profile, admins can delete any)
router.delete('/:id', authenticateToken, deleteUserById);

export default router;
