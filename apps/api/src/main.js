import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import routes from './routes/index.js';
import { errorMiddleware } from './middleware/index.js';
import logger from './utils/logger.js';


const app = express();

process.on('uncaughtException', (error) => {
	logger.error('Uncaught exception:', error);
});
  
process.on('unhandledRejection', (reason, promise) => {
	logger.error('Unhandled rejection at:', promise, 'reason:', reason);
});

process.on('SIGINT', async () => {
	logger.info('Interrupted');
	process.exit(0);
});

process.on('SIGTERM', async () => {
	logger.info('SIGTERM signal received');

	await new Promise(resolve => setTimeout(resolve, 3000));

	logger.info('Exiting');
	process.exit();
});

// CRITICAL: Configure CORS FIRST, before all other middleware
// This ensures CORS headers are processed before any other middleware
const corsOptions = {
	origin: (origin, callback) => {
		// Allow requests from specified origins
		const allowedOrigins = [
			'https://0ff7ee04-bf2c-44c8-b614-e20aef0a5b9f.app-preview.com',
			'https://equalibrinium.com',
			'http://equalibrinium.com',
			'equalibrinium.com',
		];

		// Allow localhost with any port for development
		const isLocalhost = origin && (origin.startsWith('http://localhost:') || origin === 'http://localhost');

		// Allow requests without origin (like mobile apps or curl requests)
		if (!origin || isLocalhost || allowedOrigins.includes(origin)) {
			callback(null, true);
		} else {
			logger.warn(`CORS request blocked from origin: ${origin}`);
			callback(new Error('Not allowed by CORS'));
		}
	},
	methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
	allowedHeaders: ['Content-Type', 'Authorization'],
	credentials: true,
	optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

// Configure Helmet with custom CSP directives
app.use(helmet({
	contentSecurityPolicy: {
		directives: {
			defaultSrc: ["'self'"],
			scriptSrc: ["'self'", 'https://recaptcha.enterprise.google.com'],
			frameSrc: ['https://recaptcha.enterprise.google.com'],
			connectSrc: ["'self'", 'https://recaptcha.enterprise.google.com', 'https://*.google.com'],
			imgSrc: ["'self'", 'data:', 'https:'],
		},
	},
}));

app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/', routes());

app.use(errorMiddleware);

app.use((req, res) => {
	res.status(404).json({ error: 'Route not found' });
});

const port = process.env.PORT || 3001;

app.listen(port, () => {
	logger.info(`🚀 API Server running on http://localhost:${port}`);
});

export default app;