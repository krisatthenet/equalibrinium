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

        // Open job — notify all matching contractors via SMS + push + email
        const contractors = $app.findAllRecords('users',
            $dbx.exp(`(userType = 'contractor' OR userType = 'master')`)
        );

        let notified = 0;
        for (const c of contractors) {
            const profession = (c.get('profession') || '').toLowerCase();

            // Notify if profession matches category or if category is empty (catch-all)
            if (categoryName && profession && !profession.includes(categoryName.toLowerCase())) {
                continue;
            }

            const phone = c.get('phone');
            const email = c.get('email');
            const name  = c.get('name') || 'Contractor';
            const smsBody = `WorkBee: Naujas darbas — ${categoryName}${location ? ' (' + location + ')' : ''}. "${description}". Prisijunk ir pateik pasiūlymą: workbee.space`;

            if (phone) sendSms(phone, smsBody);

            sendPush(
                c.id,
                `New job: ${categoryName || 'Service Request'}`,
                `${location ? location + ' · ' : ''}${description || 'A new ticket matches your profession.'}`,
                '/dashboard/contractor'
            );

            if (email) {
                try {
                    const emailMsg = new MailerMessage({
                        from:    { address: 'kasparas@workbee.space', name: 'WorkBee' },
                        to:      [{ address: email }],
                        subject: `New job opportunity: ${categoryName || 'Service Request'}`,
                        html: `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#f9fafb;border-radius:12px;">
  <h2 style="color:#d97706;margin-bottom:8px;">New job matching your profession 🔔</h2>
  <p style="color:#374151;">Hi <strong>${name}</strong>,</p>
  <p style="color:#374151;">A client just posted a new service request that matches your profession:</p>
  <div style="background:#fffbeb;border-left:4px solid #d97706;padding:12px 16px;border-radius:6px;margin:16px 0;">
    <p style="margin:0;font-weight:700;color:#92400e;font-size:18px;">${categoryName || 'Service Request'}</p>
    ${location ? `<p style="margin:6px 0 0;color:#78350f;font-size:14px;">📍 ${location}</p>` : ''}
    ${description ? `<p style="margin:8px 0 0;color:#374151;font-size:14px;">"${description}"</p>` : ''}
  </div>
  <p style="color:#374151;">Be one of the first to submit a bid — early responses get more client attention.</p>
  <div style="text-align:center;margin:24px 0;">
    <a href="https://workbee.space/dashboard/contractor" style="display:inline-block;background:#d97706;color:#fff;font-weight:700;font-size:15px;padding:12px 28px;border-radius:10px;text-decoration:none;">View & Bid Now</a>
  </div>
  <p style="color:#6b7280;font-size:12px;margin-top:24px;">You're receiving this because your profession matches this request. Log in to manage notification preferences.</p>
  <p style="color:#6b7280;font-size:12px;">— WorkBee Team</p>
</div>`,
                    });
                    $app.newMailClient().send(emailMsg);
                } catch (emailErr) {
                    $app.logger().error('new ticket email failed', 'error', emailErr.message, 'contractorId', c.id);
                }
            }

            notified++;
        }

        $app.logger().info('new ticket notifications sent', 'ticketId', ticket.id, 'notified', notified);
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
