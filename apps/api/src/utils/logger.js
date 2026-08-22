import Sentry from '../instrument.js';

// Every route's try/catch logs through here instead of calling next(err), so
// this is the highest-leverage place to also report to Sentry — see
// apps/api/src/main.js for the one-time Sentry.init() call in instrument.js.
// Only error/fatal report, to keep volume down (routine warn/info stay local).
const reportToSentry = (level, args) => {
	const err = args.find((a) => a instanceof Error);
	if (err) {
		Sentry.captureException(err, { level });
	} else {
		Sentry.captureMessage(args.map(String).join(' '), level);
	}
};

const logger = {
    // Application errors - goes to stdout
    error: (...args) => {
        console.log('[ERROR]', ...args);
        reportToSentry('error', args);
    },

    // Critical system errors - goes to stderr
    fatal: (...args) => {
        console.error('[FATAL]', ...args);
        reportToSentry('fatal', args);
    },

    info: (...args) => {
        console.log('[INFO]', ...args);
    },

    debug: (...args) => {
        console.log('[DEBUG]', ...args);
    },

    warn: (...args) => {
        console.log('[WARN]', ...args);
    }
};

export default logger;

export { logger };
