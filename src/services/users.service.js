import logger from "#config/logger.js";
import {db} from "#config/database.js";
import {users} from "#models/user.mode.js";
import {eq} from "drizzle-orm";

export const getAllUsersService = async () => {
    try {
        return await db.select({
            id: users.id,
            email: users.email,
            name: users.name,
            role: users.role,
            created_at: users.created_at,
            updated_at: users.updated_at,
        }).from(users);

    } catch (err) {
        logger.error('Error getting users list', err);
        throw err;
    }
};

export const getUserById = async (id) => {
    try {
        const [user] = await db.select({
            id: users.id,
            email: users.email,
            name: users.name,
            role: users.role,
            created_at: users.created_at,
            updated_at: users.updated_at,
        }).from(users).where(eq(users.id, id)).limit(1);

        if (!user) {
            throw new Error('User not found');
        }

        return user;
    } catch (err) {
        logger.error(`Error getting user by ID ${id}:`, err);
        throw err;
    }
};

export const updateUser = async (id, updates) => {
    try {
        // First check if user exists
        const [existingUser] = await db.select({id: users.id}).from(users).where(eq(users.id, id)).limit(1);
        
        if (!existingUser) {
            throw new Error('User not found');
        }

        // Add updated_at timestamp to updates
        const updatesWithTimestamp = {
            ...updates,
            updated_at: new Date()
        };

        // Update user and return updated data
        const [updatedUser] = await db.update(users)
            .set(updatesWithTimestamp)
            .where(eq(users.id, id))
            .returning({
                id: users.id,
                email: users.email,
                name: users.name,
                role: users.role,
                created_at: users.created_at,
                updated_at: users.updated_at,
            });

        logger.info(`User ${updatedUser.email} updated successfully`);
        return updatedUser;
    } catch (err) {
        logger.error(`Error updating user ${id}:`, err);
        throw err;
    }
};

export const deleteUser = async (id) => {
    try {
        // First check if user exists
        const [existingUser] = await db.select({
            id: users.id,
            email: users.email
        }).from(users).where(eq(users.id, id)).limit(1);
        
        if (!existingUser) {
            throw new Error('User not found');
        }

        // Delete the user
        await db.delete(users).where(eq(users.id, id));
        
        logger.info(`User ${existingUser.email} deleted successfully`);
        return { message: `User ${existingUser.email} has been deleted`, deletedUser: existingUser };
    } catch (err) {
        logger.error(`Error deleting user ${id}:`, err);
        throw err;
    }
};
