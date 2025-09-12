import logger from "#config/logger.js";
import {signUpSchema} from "#validations/auth.validation.js";
import {formatValidationError} from "#utils/format.js";

export const signup = async (req, res, next) => {
    try {
        const validationResult = signUpSchema.safeParse(req.body);

        if(!validationResult.success) {
            return res.status(400).json({
                error: 'Validation failed',
                details: formatValidationError(validationResult.error)
            });
        }

        const {name, email, role} = validationResult.data;

        // AUTH SERVICE

        logger.info(`User registered successfully: ${email}`);
        res.status(201).json({
            message: 'User registered',
            user: {
                id: 1, name, email, role
            }
        });
    } catch (err) {
        logger.error('Signup error', err);

        if(err.message === 'User with this email already exists') {
            return res.status(400).json({error: "Email already exists"});
        }

        next(err);
    }
};