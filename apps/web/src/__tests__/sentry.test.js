import { describe, it, expect } from 'vitest';
import { scrubObject, beforeSend } from '../lib/sentry.js';

const SENSITIVE_SAMPLE = {
	phone: '+37060000000',
	phoneNumber: '+37060000000',
	latitude: 54.6872,
	longitude: 25.2797,
	lat: 54.6872,
	lng: 25.2797,
	email: 'user@example.com',
	emailVisibility: true,
	stripeAccountId: 'acct_123',
	stripeCustomerId: 'cus_123',
	stripeSubscriptionId: 'sub_123',
	stripeOnboarded: true,
	primerSubscriptionId: 'sub_456',
	iban: 'LT121000011101001000',
	personalCode: '38001010000',
	balance: 42,
	referralCode: 'ABC123',
	referredByCode: 'XYZ789',
	password: 'hunter2',
	token: 'abc.def.ghi',
	authorization: 'Bearer abc',
	cookie: 'session=abc',
};

const BENIGN_SAMPLE = {
	id: 'rec123',
	profession: 'Electrician',
	rating: 4.8,
	verified: true,
};

describe('scrubObject', () => {
	it('strips every known-sensitive key', () => {
		const result = scrubObject(SENSITIVE_SAMPLE);
		for (const key of Object.keys(SENSITIVE_SAMPLE)) {
			expect(result).not.toHaveProperty(key);
		}
	});

	it('preserves benign keys and values', () => {
		const result = scrubObject(BENIGN_SAMPLE);
		expect(result).toEqual(BENIGN_SAMPLE);
	});

	it('strips sensitive keys regardless of casing', () => {
		const result = scrubObject({ PHONE: '123', Latitude: 1, iBAN: 'x' });
		expect(result).toEqual({});
	});

	it('scrubs nested objects and arrays', () => {
		const result = scrubObject({
			user: { name: 'Ok', phone: '123' },
			items: [{ balance: 5, title: 'Ok' }],
		});
		expect(result).toEqual({
			user: { name: 'Ok' },
			items: [{ title: 'Ok' }],
		});
	});

	it('passes through non-object values unchanged', () => {
		expect(scrubObject('a string')).toBe('a string');
		expect(scrubObject(42)).toBe(42);
		expect(scrubObject(null)).toBe(null);
		expect(scrubObject(undefined)).toBe(undefined);
	});
});

describe('beforeSend', () => {
	it('scrubs request data, drops query string/cookies/headers, and scrubs extra/contexts/breadcrumbs', () => {
		const event = {
			request: {
				data: { ...SENSITIVE_SAMPLE, ...BENIGN_SAMPLE },
				query_string: 'phone=123',
				cookies: 'session=abc',
				headers: { Authorization: 'Bearer abc' },
			},
			extra: { ...SENSITIVE_SAMPLE, ...BENIGN_SAMPLE },
			contexts: { state: { ...SENSITIVE_SAMPLE, ...BENIGN_SAMPLE } },
			breadcrumbs: [
				{ category: 'fetch', data: { url: '/contacts', phone: '123' } },
				{ category: 'navigation' },
			],
		};

		const result = beforeSend(event);

		expect(result.request.data).toEqual(BENIGN_SAMPLE);
		expect(result.request.query_string).toBeUndefined();
		expect(result.request.cookies).toBeUndefined();
		expect(result.request.headers).toBeUndefined();
		expect(result.extra).toEqual(BENIGN_SAMPLE);
		expect(result.contexts.state).toEqual(BENIGN_SAMPLE);
		expect(result.breadcrumbs[0].data).toEqual({ url: '/contacts' });
		expect(result.breadcrumbs[1]).toEqual({ category: 'navigation' });
	});

	it('handles an event with no request/extra/contexts/breadcrumbs', () => {
		expect(() => beforeSend({})).not.toThrow();
	});
});
