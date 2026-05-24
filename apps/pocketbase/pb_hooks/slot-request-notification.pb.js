/// <reference path="../pb_data/types.d.ts" />

function sendPush(userId, title, body, url) {
    const apiUrl = $os.getenv('API_INTERNAL_URL') || 'http://localhost:3001';
    const secret = $os.getenv('INTERNAL_API_SECRET');
    if (!secret) return;
    try {
        $http.send({
            url:    `${apiUrl}/push/notify`,
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-internal-secret': secret },
            body:   JSON.stringify({ userId, title, body, url }),
        });
    } catch (err) {
        $app.logger().error('sendPush failed', 'error', err.message, 'userId', userId);
    }
}

// ---------------------------------------------------------------------------
// New slot request → notify contractor via push + email
// ---------------------------------------------------------------------------
onRecordAfterCreateSuccess((e) => {
    const req        = e.record;
    const contractorId = req.get('contractorId');
    const clientName   = req.get('clientName') || 'A client';
    const date         = req.get('date');
    const message      = req.get('message') || '';

    try {
        const contractor = $app.findRecordById('users', contractorId);
        const email      = contractor.get('email');
        const name       = contractor.get('name') || 'Contractor';

        sendPush(contractorId, `New slot request 📅`, `${clientName} wants to book ${date}`, '/dashboard/contractor');

        if (email) {
            const msg = new MailerMessage({
                from:    { address: 'kasparas@workbee.space', name: 'WorkBee' },
                to:      [{ address: email }],
                subject: `New slot request for ${date}`,
                html: `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#f9fafb;border-radius:12px;">
  <h2 style="color:#d97706;margin-bottom:8px;">New slot request 📅</h2>
  <p style="color:#374151;">Hi <strong>${name}</strong>,</p>
  <p style="color:#374151;"><strong>${clientName}</strong> wants to book <strong>${date}</strong> with you.</p>
  ${message ? `<div style="background:#fffbeb;border-left:4px solid #d97706;padding:12px 16px;border-radius:6px;margin:16px 0;"><p style="margin:0;color:#92400e;font-style:italic;">"${message}"</p></div>` : ''}
  <p style="color:#374151;">Log in to confirm or decline the request.</p>
  <div style="text-align:center;margin:24px 0;">
    <a href="https://workbee.space/dashboard/contractor" style="display:inline-block;background:#d97706;color:#fff;font-weight:700;font-size:15px;padding:12px 28px;border-radius:10px;text-decoration:none;">View Request</a>
  </div>
  <p style="color:#6b7280;font-size:12px;">— WorkBee Team</p>
</div>`,
            });
            $app.newMailClient().send(msg);
        }

        $app.logger().info('slot request notification sent', 'requestId', req.id, 'contractorId', contractorId);
    } catch (err) {
        $app.logger().error('slot request notification failed', 'error', err.message, 'requestId', req.id);
    }
}, 'slot_requests');

// ---------------------------------------------------------------------------
// Slot confirmed or declined → notify client via push + email
// ---------------------------------------------------------------------------
onRecordAfterUpdateSuccess((e) => {
    const req    = e.record;
    const status = req.get('status');
    if (status !== 'confirmed' && status !== 'declined') return;

    const clientId     = req.get('clientId');
    const contractorId = req.get('contractorId');
    const date         = req.get('date');

    try {
        const client     = $app.findRecordById('users', clientId);
        const contractor = $app.findRecordById('users', contractorId);
        const clientEmail    = client.get('email');
        const clientName     = client.get('name') || 'there';
        const contractorName = contractor.get('name') || 'The contractor';

        const isConfirmed = status === 'confirmed';
        const pushTitle   = isConfirmed ? 'Slot confirmed! 🎉' : 'Slot request declined';
        const pushBody    = isConfirmed
            ? `${contractorName} confirmed ${date}. You're booked!`
            : `${contractorName} couldn't take ${date}. Try another date.`;

        sendPush(clientId, pushTitle, pushBody, '/dashboard');

        if (clientEmail) {
            const subject = isConfirmed
                ? `Booking confirmed: ${date} with ${contractorName}`
                : `Slot request for ${date} was declined`;

            const html = isConfirmed ? `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#f9fafb;border-radius:12px;">
  <h2 style="color:#059669;margin-bottom:8px;">Your slot is confirmed! 🎉</h2>
  <p style="color:#374151;">Hi <strong>${clientName}</strong>,</p>
  <p style="color:#374151;"><strong>${contractorName}</strong> confirmed your booking for <strong>${date}</strong>.</p>
  <div style="background:#f0fdf4;border-left:4px solid #059669;padding:12px 16px;border-radius:6px;margin:16px 0;">
    <p style="margin:0;font-weight:700;color:#065f46;">📅 ${date} with ${contractorName}</p>
  </div>
  <p style="color:#374151;">Use the chat on your dashboard to coordinate the details.</p>
  <div style="text-align:center;margin:24px 0;">
    <a href="https://workbee.space/dashboard" style="display:inline-block;background:#059669;color:#fff;font-weight:700;font-size:15px;padding:12px 28px;border-radius:10px;text-decoration:none;">Go to Dashboard</a>
  </div>
  <p style="color:#6b7280;font-size:12px;">— WorkBee Team</p>
</div>` : `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#f9fafb;border-radius:12px;">
  <h2 style="color:#6b7280;margin-bottom:8px;">Slot request declined</h2>
  <p style="color:#374151;">Hi <strong>${clientName}</strong>,</p>
  <p style="color:#374151;">Unfortunately <strong>${contractorName}</strong> isn't available on <strong>${date}</strong>.</p>
  <p style="color:#374151;">Check their profile for other available dates or browse other contractors.</p>
  <div style="text-align:center;margin:24px 0;">
    <a href="https://workbee.space/contractors" style="display:inline-block;background:#1d4ed8;color:#fff;font-weight:700;font-size:15px;padding:12px 28px;border-radius:10px;text-decoration:none;">Browse Contractors</a>
  </div>
  <p style="color:#6b7280;font-size:12px;">— WorkBee Team</p>
</div>`;

            const emailMsg = new MailerMessage({
                from:    { address: 'kasparas@workbee.space', name: 'WorkBee' },
                to:      [{ address: clientEmail }],
                subject,
                html,
            });
            $app.newMailClient().send(emailMsg);
        }

        $app.logger().info('slot response notification sent', 'requestId', req.id, 'status', status);
    } catch (err) {
        $app.logger().error('slot response notification failed', 'error', err.message, 'requestId', req.id);
    }
}, 'slot_requests');
