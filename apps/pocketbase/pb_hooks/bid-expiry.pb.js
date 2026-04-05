/// <reference path="../pb_data/types.d.ts" />

const BID_EXPIRY_HOURS = 72;

// Set expiresAt when a bid is created
onRecordAfterCreateSuccess((e) => {
    const bid = e.record;
    try {
        const expires = new Date(Date.now() + BID_EXPIRY_HOURS * 60 * 60 * 1000);
        // PocketBase date format: YYYY-MM-DD HH:MM:SS.sssZ
        bid.set('expiresAt', expires.toISOString().replace('T', ' '));
        $app.save(bid);
    } catch (err) {
        $app.logger().error('bid expiresAt set failed', 'error', err.message, 'bidId', bid.id);
    }
}, 'bids');

// Hourly cron — expire pending bids past their expiresAt
cronAdd('expire-bids', '0 * * * *', () => {
    try {
        const now = new Date().toISOString().replace('T', ' ');
        const expiredBids = $app.findAllRecords('bids',
            $dbx.exp(`status = 'pending' AND expiresAt != '' AND expiresAt <= {:now}`, { now })
        );

        for (const bid of expiredBids) {
            bid.set('status', 'expired');
            $app.save(bid);
        }

        if (expiredBids.length > 0) {
            $app.logger().info('bids expired', 'count', expiredBids.length);
        }
    } catch (err) {
        $app.logger().error('bid expiry cron failed', 'error', err.message);
    }
});
