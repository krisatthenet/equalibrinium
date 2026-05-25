import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import routes from './routes/index.js';
import { errorMiddleware } from './middleware/index.js';
import logger from './utils/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));


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
const extraOrigins = process.env.ALLOWED_ORIGINS
	? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
	: [];

const corsOptions = {
	origin: (origin, callback) => {
		// Allow requests from specified origins
		const allowedOrigins = [
			'https://workbee.space',
			'http://workbee.space',
			...extraOrigins,
		];

		// Allow localhost with any port for development
		const isLocalhost = origin && (origin.startsWith('http://localhost:') || origin === 'http://localhost');
		const isNgrok = origin && (origin.endsWith('.ngrok-free.dev') || origin.endsWith('.ngrok.io'));

		// Allow requests without origin (like mobile apps or curl requests)
		if (!origin || isLocalhost || isNgrok || allowedOrigins.includes(origin)) {
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
// Stripe webhook needs raw body — must be before express.json()
app.use('/stripe/webhook', express.raw({ type: 'application/json' }));
app.use('/hcgi/api/stripe/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mount API routes at both root (for direct calls) and /hcgi/api (for production frontend)
app.use('/', routes());
app.use('/hcgi/api', routes());

// Serve built frontend static files in production (only if the dist folder exists)
const isProduction = process.env.NODE_ENV === 'production';
if (isProduction) {
	const staticPath = path.resolve(__dirname, '../../../dist/apps/web');
	const indexHtml = path.join(staticPath, 'index.html');
	try {
		const fs = await import('node:fs');
		if (fs.existsSync(indexHtml)) {
			app.use(express.static(staticPath));
			app.get('/{*path}', (req, res) => {
				res.sendFile(indexHtml);
			});
		}
	} catch (_) {
		// dist not present — API-only mode, SPA served separately
	}
}

app.use(errorMiddleware);

app.use((req, res) => {
	res.status(404).json({ error: 'Route not found' });
});

const port = process.env.PORT || 3001;

app.listen(port, () => {
	logger.info(`🚀 API Server running on http://localhost:${port}`);
});

export default app;