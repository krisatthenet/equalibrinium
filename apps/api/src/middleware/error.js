import logger from '../utils/logger.js';
import { NodeEnv } from '../constants/common.js';

export default (err, req, res, next) => {
	logger.error(err);

	if (res.headersSent) {
		return next(err);
	}

	const statusCode = err.status || err.statusCode || 500;

	res.status(statusCode).json({
		message: err.message || 'Something went wrong!',
		...(process.env.NODE_ENV !== NodeEnv.Production && {
			error: {
				name: err.name,
				message: err.message,
				stack: err.stack,
			},
		}),
	});
};
