import express from 'express';
import PocketBase from 'pocketbase';
import logger from '../utils/logger.js';

const router = express.Router();
const PB_URL = process.env.POCKETBASE_URL || 'https://workbee-pocketbase-cayj-production.up.railway.app';

// DAC7 exempts sellers below BOTH thresholds — reportable if either is met.
// See docs/COMPLIANCE_DAC7_KYC.md.
const DAC7_MIN_TRANSACTIONS = 30;
const DAC7_MIN_AMOUNT_EUR = 2000;

async function adminPb() {
	const pb = new PocketBase(PB_URL);
	await pb.collection('_superusers').authWithPassword(
		process.env.POCKETBASE_ADMIN_EMAIL,
		process.env.POCKETBASE_ADMIN_PASSWORD,
	);
	return pb;
}

// Fails closed if the secret isn't configured (undefined !== undefined would
// otherwise let an unauthenticated request through with no header at all).
function requireInternalSecret(req, res, next) {
	const configured = process.env.DAC7_REPORT_SECRET;
	const provided = req.headers['x-internal-secret'];
	if (!configured || provided !== configured) {
		return res.status(403).json({ error: 'Forbidden' });
	}
	next();
}

function csvEscape(value) {
	const str = String(value ?? '');
	return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

/**
 * GET /compliance/dac7-report?year=2026&format=csv|json
 *
 * Identifies contractors crossing the DAC7 reporting threshold (>=30
 * transactions OR >=EUR 2,000 total) for a calendar year, from completed
 * `payments` records. `payments.userId` is the payer (client), not the
 * contractor, so the contractor is resolved via
 * ticket.acceptedBidId -> bid.masterId (same fallback the Stripe webhook
 * uses when Stripe metadata is missing).
 *
 * This is a working export for internal/legal review — NOT a verified VMI
 * submission format (see docs/COMPLIANCE_DAC7_KYC.md item 3).
 */
router.get('/dac7-report', requireInternalSecret, async (req, res) => {
	const year = req.query.year ? parseInt(req.query.year, 10) : new Date().getFullYear() - 1;
	if (!Number.isInteger(year) || year < 2020 || year > new Date().getFullYear()) {
		return res.status(400).json({ error: 'year must be a valid 4-digit calendar year' });
	}

	try {
		const pb = await adminPb();

		const payments = await pb.collection('payments').getFullList({
			filter: `status = "completed" && created >= "${year}-01-01 00:00:00" && created <= "${year}-12-31 23:59:59"`,
		});

		const ticketCache = new Map();
		const bidCache = new Map();
		const totals = new Map(); // contractorId -> { count, amount }
		let unresolvedCount = 0;

		for (const payment of payments) {
			let ticket = ticketCache.get(payment.ticketId);
			if (ticket === undefined) {
				ticket = await pb.collection('auction_tickets').getOne(payment.ticketId).catch(() => null);
				ticketCache.set(payment.ticketId, ticket);
			}
			if (!ticket?.acceptedBidId) {
				unresolvedCount += 1;
				continue;
			}

			let bid = bidCache.get(ticket.acceptedBidId);
			if (bid === undefined) {
				bid = await pb.collection('bids').getOne(ticket.acceptedBidId).catch(() => null);
				bidCache.set(ticket.acceptedBidId, bid);
			}
			const contractorId = bid?.masterId;
			if (!contractorId) {
				unresolvedCount += 1;
				continue;
			}

			const entry = totals.get(contractorId) || { count: 0, amount: 0 };
			entry.count += 1;
			entry.amount += Number(payment.amount) || 0;
			totals.set(contractorId, entry);
		}

		const qualifying = [];
		let belowThresholdCount = 0;

		for (const [contractorId, { count, amount }] of totals) {
			const totalAmountEUR = parseFloat(amount.toFixed(2));
			if (count < DAC7_MIN_TRANSACTIONS && totalAmountEUR < DAC7_MIN_AMOUNT_EUR) {
				belowThresholdCount += 1;
				continue;
			}

			const [user, kycList] = await Promise.all([
				pb.collection('users').getOne(contractorId).catch(() => null),
				pb.collection('contractor_kyc')
					.getList(1, 1, { filter: `userId = "${contractorId}"` })
					.catch(() => ({ items: [] })),
			]);
			const kyc = kycList.items[0] || null;

			qualifying.push({
				contractorId,
				name: user?.name || null,
				transactionCount: count,
				totalAmountEUR,
				personalCode: kyc?.personalCode || null,
				businessCode: kyc?.businessCode || null,
				iban: kyc?.iban || null,
				missingKyc: !kyc,
			});
		}

		qualifying.sort((a, b) => b.totalAmountEUR - a.totalAmountEUR);

		logger.info(
			`DAC7 report generated for ${year}: ${qualifying.length} qualifying, ` +
			`${belowThresholdCount} below threshold, ${unresolvedCount} unresolved contractor`
		);

		if (req.query.format === 'csv') {
			const header = ['contractorId', 'name', 'transactionCount', 'totalAmountEUR', 'personalCode', 'businessCode', 'iban', 'missingKyc'];
			const rows = qualifying.map((r) => header.map((h) => csvEscape(r[h])).join(','));
			const csv = [header.join(','), ...rows].join('\n');
			res.setHeader('Content-Type', 'text/csv');
			res.setHeader('Content-Disposition', `attachment; filename="dac7-report-${year}.csv"`);
			return res.send(csv);
		}

		res.json({
			year,
			generatedAt: new Date().toISOString(),
			note: 'Working export for internal/legal review only — not a verified VMI submission format. See docs/COMPLIANCE_DAC7_KYC.md.',
			thresholds: { transactions: DAC7_MIN_TRANSACTIONS, amountEUR: DAC7_MIN_AMOUNT_EUR },
			qualifyingCount: qualifying.length,
			belowThresholdCount,
			unresolvedCount,
			qualifying,
		});
	} catch (err) {
		logger.error('dac7-report error:', err);
		res.status(500).json({ error: err.message || 'Failed to generate DAC7 report' });
	}
});

export default router;
