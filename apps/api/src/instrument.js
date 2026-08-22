import * as Sentry from '@sentry/node';

// Fields this app has previously leaked as PII (see the users-PII-hardening
// migration, 1785800000_hide_sensitive_user_fields.js in apps/pocketbase)
// plus standard secrets. Stripped from every outgoing event.
const SENSITIVE_KEYS = new Set([
	'phone', 'phonenumber',
	'latitude', 'longitude', 'lat', 'lng',
	'email', 'emailvisibility',
	'stripeaccountid', 'stripecustomerid', 'stripesubscriptionid', 'stripeonboarded',
	'primersubscriptionid',
	'iban',
	'personalcode',
	'balance',
	'referralcode', 'referredbycode',
	'password', 'token', 'authorization', 'cookie',
]);

const MAX_DEPTH = 4;

export function scrubObject(value, depth = 0) {
	if (!value || typeof value !== 'object' || depth >= MAX_DEPTH) return value;

	if (Array.isArray(value)) {
		return value.map((item) => scrubObject(item, depth + 1));
	}

	const scrubbed = {};
	for (const [key, val] of Object.entries(value)) {
		if (SENSITIVE_KEYS.has(key.toLowerCase())) continue;
		scrubbed[key] = scrubObject(val, depth + 1);
	}
	return scrubbed;
}

export function beforeSend(event) {
	if (event.request) {
		event.request = {
			...event.request,
			data: scrubObject(event.request.data),
			query_string: undefined,
			cookies: undefined,
			headers: undefined,
		};
	}
	if (event.extra) event.extra = scrubObject(event.extra);
	if (event.contexts) event.contexts = scrubObject(event.contexts);
	if (event.breadcrumbs) {
		event.breadcrumbs = event.breadcrumbs.map((crumb) =>
			crumb?.data ? { ...crumb, data: scrubObject(crumb.data) } : crumb
		);
	}
	return event;
}

if (process.env.SENTRY_DSN) {
	Sentry.init({
		dsn: process.env.SENTRY_DSN,
		environment: process.env.NODE_ENV || 'development',
		tracesSampleRate: 0,
		sendDefaultPii: false,
		beforeSend,
	});
}

export default Sentry;
