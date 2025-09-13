import logger from "#config/logger.js";
import bcrypt from "bcrypt";
import {db} from "#config/database.js";
import {users} from "#models/user.mode.js";
import {eq} from "drizzle-orm";

export const hashPassword = async (password) => {
    try {
        return await bcrypt.hash(password,10);
    } catch (err) {
        logger.error(`Error hashing the password: ${err}`);
        throw new Error('Error hashing the password');
    }
};

export const comparePassword = async (password, hashedPassword) => {
    try {
        return await bcrypt.compare(password, hashedPassword);
    } catch (err) {
        logger.error(`Error comparing password: ${err}`);
        throw new Error('Error verifying password');
    }
};

export const authenticateUser = async ({email, password}) => {
    try {
        const [existingUser] = await db.select().from(users).where(eq(users.email, email)).limit(1);

        if (!existingUser) {
            throw new Error('Invalid email or password');
        }

        const isPasswordValid = await comparePassword(password, existingUser.password);
        
        if (!isPasswordValid) {
            throw new Error('Invalid email or password');
        }

        // Return user without password
        // eslint-disable-next-line no-unused-vars
        const {password: _, ...userWithoutPassword} = existingUser;
        // Possible to change _ to unused or ignore for password in const
        return userWithoutPassword;
    } catch (err) {
        logger.error(`Error authenticating user: ${err}`);
        throw err;
    }
};

export const createUser = async ({name, email, password, role = 'user'}) => {
    try {
        const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);

        if(existingUser.length > 0) throw new Error("User already exists");

        const password_hash = await hashPassword(password);

        const [newUser] = await db.insert(users).values({name, email, password: password_hash, role}).returning({id: users.id, name: users.name, email: users.email, role: users.role, created_at: users.created_at });

        logger.info(`User ${newUser.email} created successfully`);
        return newUser;
    } catch (err) {
        logger.error(`Error creating the user: ${err}`);
        throw err;
    }
};
