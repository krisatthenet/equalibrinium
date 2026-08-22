import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../test-utils/createApp.js';

// ---------------------------------------------------------------------------
// PocketBase mock — one fake collection store per collection name
// ---------------------------------------------------------------------------
const { store } = vi.hoisted(() => ({
	store: {
		payments: [],
		auction_tickets: {}, // id -> ticket
		bids: {}, // id -> bid
		users: {}, // id -> user
		contractor_kyc: {}, // userId -> kyc record
	},
}));

vi.mock('pocketbase', () => ({
	default: function PocketBase() {
		return {
			authStore: { save: vi.fn() },
			collection: (name) => ({
				authWithPassword: vi.fn(),
				getFullList: vi.fn(async () => {
					if (name === 'payments') return store.payments;
					return [];
				}),
				getOne: vi.fn(async (id) => {
					const table = store[name] || {};
					if (!table[id]) throw new Error('not found');
					return table[id];
				}),
				getList: vi.fn(async (_page, _perPage, { filter } = {}) => {
					if (name === 'contractor_kyc') {
						const match = filter?.match(/userId = "([^"]+)"/);
						const userId = match?.[1];
						const rec = store.contractor_kyc[userId];
						return { items: rec ? [rec] : [] };
					}
					return { items: [] };
				}),
			}),
		};
	},
}));

const SECRET = 'test-internal-secret';

function resetStore() {
	store.payments = [];
	store.auction_tickets = {};
	store.bids = {};
	store.users = {};
	store.contractor_kyc = {};
}

describe('GET /compliance/dac7-report', () => {
	const app = createApp();

	beforeEach(() => {
		vi.clearAllMocks();
		resetStore();
		process.env.DAC7_REPORT_SECRET = SECRET;
		process.env.POCKETBASE_ADMIN_EMAIL = 'admin@example.com';
		process.env.POCKETBASE_ADMIN_PASSWORD = 'pw';
	});

	it('returns 403 without the internal secret header', async () => {
		const res = await request(app).get('/compliance/dac7-report?year=2026');
		expect(res.status).toBe(403);
	});

	it('returns 403 when DAC7_REPORT_SECRET is not configured (fails closed)', async () => {
		delete process.env.DAC7_REPORT_SECRET;
		const res = await request(app).get('/compliance/dac7-report?year=2026');
		expect(res.status).toBe(403);
	});

	it('returns 400 for an invalid year', async () => {
		const res = await request(app)
			.get('/compliance/dac7-report?year=notayear')
			.set('x-internal-secret', SECRET);
		expect(res.status).toBe(400);
	});

	it('reports a contractor who crosses the transaction-count threshold', async () => {
		store.auction_tickets.t1 = { acceptedBidId: 'b1' };
		store.bids.b1 = { masterId: 'contractor1' };
		store.users.contractor1 = { name: 'Jonas' };
		store.contractor_kyc.contractor1 = { personalCode: '12345678901', businessCode: 'BC1', iban: 'LT123' };

		store.payments = Array.from({ length: 30 }, (_, i) => ({
			ticketId: 't1',
			amount: 10,
			status: 'completed',
			created: `2026-0${(i % 9) + 1}-01 00:00:00`,
		}));

		const res = await request(app)
			.get('/compliance/dac7-report?year=2026')
			.set('x-internal-secret', SECRET);

		expect(res.status).toBe(200);
		expect(res.body.qualifyingCount).toBe(1);
		expect(res.body.qualifying[0]).toMatchObject({
			contractorId: 'contractor1',
			name: 'Jonas',
			transactionCount: 30,
			totalAmountEUR: 300,
			personalCode: '12345678901',
			iban: 'LT123',
			missingKyc: false,
		});
	});

	it('reports a contractor who crosses the amount threshold with few transactions', async () => {
		store.auction_tickets.t2 = { acceptedBidId: 'b2' };
		store.bids.b2 = { masterId: 'contractor2' };
		store.users.contractor2 = { name: 'Petras' };

		store.payments = [
			{ ticketId: 't2', amount: 2500, status: 'completed', created: '2026-05-01 00:00:00' },
		];

		const res = await request(app)
			.get('/compliance/dac7-report?year=2026')
			.set('x-internal-secret', SECRET);

		expect(res.status).toBe(200);
		expect(res.body.qualifyingCount).toBe(1);
		expect(res.body.qualifying[0]).toMatchObject({
			contractorId: 'contractor2',
			transactionCount: 1,
			totalAmountEUR: 2500,
			missingKyc: true,
		});
	});

	it('excludes contractors below both thresholds', async () => {
		store.auction_tickets.t3 = { acceptedBidId: 'b3' };
		store.bids.b3 = { masterId: 'contractor3' };
		store.users.contractor3 = { name: 'Below' };

		store.payments = [
			{ ticketId: 't3', amount: 50, status: 'completed', created: '2026-01-01 00:00:00' },
		];

		const res = await request(app)
			.get('/compliance/dac7-report?year=2026')
			.set('x-internal-secret', SECRET);

		expect(res.status).toBe(200);
		expect(res.body.qualifyingCount).toBe(0);
		expect(res.body.belowThresholdCount).toBe(1);
	});

	it('counts payments whose ticket/bid cannot be resolved as unresolved, not a crash', async () => {
		store.payments = [
			{ ticketId: 'missing-ticket', amount: 5000, status: 'completed', created: '2026-01-01 00:00:00' },
		];

		const res = await request(app)
			.get('/compliance/dac7-report?year=2026')
			.set('x-internal-secret', SECRET);

		expect(res.status).toBe(200);
		expect(res.body.unresolvedCount).toBe(1);
		expect(res.body.qualifyingCount).toBe(0);
	});

	it('returns CSV when format=csv is requested', async () => {
		store.auction_tickets.t1 = { acceptedBidId: 'b1' };
		store.bids.b1 = { masterId: 'contractor1' };
		store.users.contractor1 = { name: 'Jonas' };

		store.payments = [
			{ ticketId: 't1', amount: 2500, status: 'completed', created: '2026-01-01 00:00:00' },
		];

		const res = await request(app)
			.get('/compliance/dac7-report?year=2026&format=csv')
			.set('x-internal-secret', SECRET);

		expect(res.status).toBe(200);
		expect(res.headers['content-type']).toMatch(/text\/csv/);
		expect(res.text).toMatch(/contractorId,name,transactionCount/);
		expect(res.text).toMatch(/contractor1,Jonas,1,2500/);
	});
});
