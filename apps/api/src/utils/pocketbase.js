import 'dotenv/config';
import PocketBase from 'pocketbase';
import logger from './logger.js';

const pbUrl = process.env.POCKETBASE_URL || 'http://localhost:8090';

let pb = null;

/**
 * Get or initialize PocketBase client
 * @returns {PocketBase} PocketBase client instance
 */
export function getPocketBase() {
	if (!pb) {
		pb = new PocketBase(pbUrl);
		logger.info(`PocketBase client initialized with URL: ${pbUrl}`);
	}
	return pb;
}

/**
 * Authenticate user with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<{token: string, user: {id: string, email: string, name: string, userType: string}}>}
 * @throws {Error} If authentication fails
 */
export async function authenticateUser(email, password) {
	const pb = getPocketBase();

	try {
		const authData = await pb.collection('users').authWithPassword(email, password);

		logger.info(`User authenticated successfully: ${email}`);

		return {
			token: authData.token,
			user: {
				id: authData.record.id,
				email: authData.record.email,
				name: authData.record.name || '',
				userType: authData.record.userType || 'user',
			},
		};
	} catch (error) {
		logger.error(`Authentication failed for email ${email}:`, error.message);

		// Handle specific PocketBase error codes
		if (error.status === 400) {
			const err = new Error('Invalid email or password');
			err.status = 401;
			throw err;
		}

		if (error.status === 404) {
			const err = new Error('User not found');
			err.status = 401;
			throw err;
		}

		// Re-throw with appropriate status
		const err = new Error(error.message || 'Authentication failed');
		err.status = error.status || 500;
		throw err;
	}
}

/**
 * Register a new user
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {string} name - User name (optional)
 * @returns {Promise<{token: string, user: {id: string, email: string, name: string, userType: string}}>}
 * @throws {Error} If registration fails
 */
export async function registerUser(email, password, name = '') {
	const pb = getPocketBase();

	try {
		const userData = {
			email: email,
			password: password,
			passwordConfirm: password,
			name: name,
			userType: 'user',
		};

		const record = await pb.collection('users').create(userData);
		const authData = await pb.collection('users').authWithPassword(email, password);

		logger.info(`User registered successfully: ${email}`);

		return {
			token: authData.token,
			user: {
				id: record.id,
				email: record.email,
				name: record.name || '',
				userType: record.userType || 'user',
			},
		};
	} catch (error) {
		logger.error(`Registration failed for email ${email}:`, error.message);

		// Handle specific PocketBase error codes
		if (error.status === 400) {
			const err = new Error(error.message || 'Invalid registration data');
			err.status = 400;
			throw err;
		}

		const err = new Error(error.message || 'Registration failed');
		err.status = error.status || 500;
		throw err;
	}
}

export default getPocketBase;