/// <reference path="../pb_data/types.d.ts" />

/**
 * Send a push notification via the Node.js API.
 * Requires env vars: API_INTERNAL_URL, INTERNAL_API_SECRET
 */
function sendPush(userId, title, body, url) {
    const apiUrl  = $os.getenv('API_INTERNAL_URL') || 'http://localhost:3001';
    const secret  = $os.getenv('INTERNAL_API_SECRET');
    if (!secret) return;

    try {
        $http.send({
            url: `${apiUrl}/push/notify`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-internal-secret': secret,
            },
            body: JSON.stringify({ userId, title, body, url }),
        });
    } catch (err) {
        $app.logger().error('sendPush failed', 'error', err.message, 'userId', userId);
    }
}

/**
 * Send an SMS via Twilio.
 * Requires env vars: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER
 */
function sendSms(to, body) {
    const accountSid = $os.getenv('TWILIO_ACCOUNT_SID');
    const authToken  = $os.getenv('TWILIO_AUTH_TOKEN');
    const from       = $os.getenv('TWILIO_FROM_NUMBER');

    if (!accountSid || !authToken || !from) {
        $app.logger().warn('SMS skipped — Twilio env vars not set');
        return;
    }
    if (!to) return;

    // Normalise Lithuanian numbers: 8XXXXXXXX → +3708XXXXXXXX
    let normalised = to.trim();
    if (normalised.startsWith('8') && normalised.length === 9) {
        normalised = '+370' + normalised.slice(1);
    } else if (!normalised.startsWith('+')) {
        normalised = '+' + normalised;
    }

    try {
        const credentials = btoa(`${accountSid}:${authToken}`);
        const params = [
            `From=${encodeURIComponent(from)}`,
            `To=${encodeURIComponent(normalised)}`,
            `Body=${encodeURIComponent(body)}`,
        ].join('&');

        const response = $http.send({
            url: `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
            method: 'POST',
            headers: {
                'Authorization': `Basic ${credentials}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params,
        });

        if (response.statusCode >= 400) {
            $app.logger().error('Twilio error', 'status', response.statusCode, 'body', response.raw);
        } else {
            $app.logger().info('SMS sent', 'to', normalised);
        }
    } catch (err) {
        $app.logger().error('SMS send failed', 'error', err.message, 'to', normalised);
    }
}

// ---------------------------------------------------------------------------
// New auction ticket created → notify matching contractors (open jobs)
//                            OR notify assigned contractor (direct requests)
// ---------------------------------------------------------------------------
onRecordAfterCreateSuccess((e) => {
    const ticket = e.record;

    try {
        let categoryName = '';
        try {
            const category = $app.findRecordById('categories', ticket.get('categoryId'));
            categoryName = category.get('name') || '';
        } catch (_) {}

        const location    = ticket.get('location') || '';
        const description = (ticket.get('description') || '').slice(0, 80);
        const isDirect    = ticket.get('isDirect');
        const assignedId  = ticket.get('assignedContractorId');

        if (isDirect && assignedId) {
            // Direct request — notify only the assigned contractor
            try {
                const contractor = $app.findRecordById('users', assignedId);
                const phone = contractor.get('phone');
                const clientName = (() => {
                    try { return $app.findRecordById('users', ticket.get('clientId')).get('name') || 'Klientas'; } catch (_) { return 'Klientas'; }
                })();
                const msg = `WorkBee: ${clientName} siunčia tau tiesioginį užklausimą — ${categoryName}${location ? ' (' + location + ')' : ''}. "${description}". Atsakyk per workbee.space`;
                if (phone) sendSms(phone, msg);
                sendPush(assignedId, 'Tiesioginis užklausimas', `${clientName}: ${categoryName}${location ? ' (' + location + ')' : ''}`, '/dashboard');
                $app.logger().info('direct request notifications sent', 'ticketId', ticket.id, 'contractorId', assignedId);
            } catch (err) {
                $app.logger().error('direct request notification failed', 'error', err.message, 'ticketId', ticket.id);
            }
            return;
        }

        // Open job — notify all matching contractors
        const contractors = $app.findAllRecords('users',
            $dbx.exp(`(userType = 'contractor' OR userType = 'master') AND phone != ''`)
        );

        let notified = 0;
        for (const c of contractors) {
            const profession = (c.get('profession') || '').toLowerCase();

            // Notify if profession matches category or if category is empty (catch-all)
            if (categoryName && profession && !profession.includes(categoryName.toLowerCase())) {
                continue;
            }

            const phone = c.get('phone');
            const msg = `WorkBee: Naujas darbas — ${categoryName}${location ? ' (' + location + ')' : ''}. "${description}". Prisijunk ir pateik pasiūlymą: workbee.space`;
            sendSms(phone, msg);
            notified++;
        }

        $app.logger().info('new ticket SMS notifications sent', 'ticketId', ticket.id, 'notified', notified);
    } catch (err) {
        $app.logger().error('new ticket SMS failed', 'error', err.message, 'ticketId', ticket.id);
    }
}, 'auction_tickets');

// ---------------------------------------------------------------------------
// Bid accepted → SMS to contractor
// ---------------------------------------------------------------------------
onRecordAfterUpdateSuccess((e) => {
    const bid = e.record;
    if (bid.get('status') !== 'accepted') return;

    try {
        const contractor = $app.findRecordById('users', bid.get('masterId'));
        const phone = contractor.get('phone');
        if (!phone) return;

        let categoryName = 'paslaugos';
        try {
            const ticket   = $app.findRecordById('auction_tickets', bid.get('ticketId'));
            const category = $app.findRecordById('categories', ticket.get('categoryId'));
            categoryName   = category.get('name') || categoryName;
        } catch (_) {}

        const rate = bid.get('proposedRate');
        if (phone) sendSms(phone, `WorkBee: Tavo pasiūlymas priimtas! Kategorija: ${categoryName}, suma: €${rate}. Susisiek su klientu per workbee.space`);
        sendPush(bid.get('masterId'), 'Pasiūlymas priimtas! 🎉', `${categoryName} — €${rate}. Susisiek su klientu.`, '/dashboard');
    } catch (err) {
        $app.logger().error('bid accepted SMS failed', 'error', err.message, 'bidId', bid.id);
    }
}, 'bids');

// ---------------------------------------------------------------------------
// Payment completed → SMS to contractor
// ---------------------------------------------------------------------------
onRecordAfterCreateSuccess((e) => {
    const payment = e.record;
    if (payment.get('status') !== 'completed') return;

    try {
        const ticketId = payment.get('ticketId');
        const amount   = Number(payment.get('amount')) || 0;
        const payout   = (amount * 0.95).toFixed(2);

        const bids = $app.findAllRecords('bids',
            $dbx.exp('ticketId = {:id} AND status = "accepted"', { id: ticketId })
        );
        if (bids.length === 0) return;

        const contractor = $app.findRecordById('users', bids[0].get('masterId'));
        const phone = contractor.get('phone');
        if (!phone) return;

        if (phone) sendSms(phone, `WorkBee: Mokėjimas gautas! €${payout} pridėta prie tavo balanso. Peržiūrėk savo paskyrą: workbee.space`);
        sendPush(bids[0].get('masterId'), 'Mokėjimas gautas! 💰', `€${payout} pridėta prie tavo balanso.`, '/dashboard');
    } catch (err) {
        $app.logger().error('payment SMS failed', 'error', err.message, 'paymentId', e.record.id);
    }
}, 'payments');
