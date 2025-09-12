import logger from "#config/logger.js";
import {signUpSchema, signInSchema} from "#validations/auth.validation.js";
import {formatValidationError} from "#utils/format.js";
import {createUser, authenticateUser} from "#services/auth.services.js";
import {jwttoken} from "#utils/jwt.js";
import {cookies} from "#utils/cookies.js";

export const signup = async (req, res, next) => {
    try {
        const validationResult = signUpSchema.safeParse(req.body);

        if(!validationResult.success) {
            return res.status(400).json({
                error: 'Validation failed',
                details: formatValidationError(validationResult.error)
            });
        }

        const {name, email, password, role} = validationResult.data;

        // AUTH SERVICE

        const user = await createUser({name, email, password, role});
        const token = jwttoken.sign({id: user.id, email: user.email, role: user.role});

        cookies.set(res, 'token', token);

        logger.info(`User registered successfully: ${email}`);
        res.status(201).json({
            message: 'User registered',
            user: {
                id: user.id, name: user.name, email: user.email, role: user.role
            }
        });
    } catch (err) {
        logger.error('Signup error', err);

        // if(err.message === 'User with this email already exists') {
        //     return res.status(409).json({error: "Email already exists"});
        // }

        if(err) {
            return res.status(409).json({error: "Email already exists"});
        }

        next(err);
    }
};

export const signin = async (req, res, next) => {
    try {
        const validationResult = signInSchema.safeParse(req.body);

        if (!validationResult.success) {
            return res.status(400).json({
                error: 'Validation failed',
                details: formatValidationError(validationResult.error)
            });
        }

        const {email, password} = validationResult.data;

        // AUTH SERVICE
        const user = await authenticateUser({email, password});
        const token = jwttoken.sign({id: user.id, email: user.email, role: user.role});

        cookies.set(res, 'token', token);

        logger.info(`User signed in successfully: ${email}`);
        res.status(200).json({
            message: 'User signed in successfully',
            user: {
                id: user.id, 
                name: user.name, 
                email: user.email, 
                role: user.role
            }
        });
    } catch (err) {
        logger.error('Signin error', err);

        if (err.message === 'Invalid email or password') {
            return res.status(401).json({error: 'Invalid email or password'});
        }

        next(err);
    }
};

export const signout = async (req, res, next) => {
    try {
        cookies.clear(res, 'token');
        
        logger.info('User signed out successfully');
        res.status(200).json({
            message: 'User signed out successfully'
        });
    } catch (err) {
        logger.error('Signout error', err);
        next(err);
    }
};
