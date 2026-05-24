/// <reference path="../pb_data/types.d.ts" />

/**
 * Message received notifications.
 *
 * Push fires on every message.
 * Email fires only if no message has been sent in this ticket in the last 30 min
 * (avoids spamming active conversations while still re-engaging idle recipients).
 */

function sendPushToUser(userId, title, body, url) {
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
        $app.logger().error('sendPushToUser failed', 'error', err.message, 'userId', userId);
    }
}

onRecordAfterCreateSuccess((e) => {
    const msg      = e.record;
    const senderId = msg.get('senderId');
    const ticketId = msg.get('ticketId');
    const text     = (msg.get('text') || '').slice(0, 120);

    try {
        const ticket   = $app.findRecordById('auction_tickets', ticketId);
        const clientId = ticket.get('clientId');

        // --- Resolve the other party ---
        let recipientId   = '';
        let recipientName = '';

        if (senderId === clientId) {
            // Sender is the client → recipient is the contractor
            const assignedId = ticket.get('assignedContractorId');
            if (assignedId) {
                recipientId = assignedId;
            } else {
                // Fall back to accepted bid
                try {
                    const bids = $app.findAllRecords('bids',
                        $dbx.exp('ticketId = {:tid} AND status = "accepted"', { tid: ticketId })
                    );
                    if (bids.length > 0) recipientId = bids[0].get('masterId');
                } catch (_) {}
            }
        } else {
            // Sender is the contractor → recipient is the client
            recipientId = clientId;
        }

        if (!recipientId) return; // no recipient resolved, nothing to do

        const recipient = $app.findRecordById('users', recipientId);
        recipientName   = recipient.get('name') || recipient.get('email') || 'User';

        const senderName  = msg.get('senderName') || 'Someone';
        const categoryName = (() => {
            try {
                return $app.findRecordById('categories', ticket.get('categoryId')).get('name') || 'Job';
            } catch (_) { return 'Job'; }
        })();

        // --- Push (always) ---
        sendPushToUser(
            recipientId,
            `${senderName} sent you a message`,
            text || '(new message)',
            '/dashboard'
        );

        // --- Email (debounced: only if conversation was quiet for 30 min) ---
        const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString().replace('T', ' ');
        let recentCount = 0;
        try {
            const recent = $app.findAllRecords('messages',
                $dbx.exp(
                    'ticketId = {:tid} AND senderId = {:sid} AND created >= {:ts} AND id != {:mid}',
                    { tid: ticketId, sid: senderId, ts: thirtyMinAgo, mid: msg.id }
                )
            );
            recentCount = recent.length;
        } catch (_) {}

        if (recentCount > 0) {
            $app.logger().info('message email suppressed (active conversation)', 'ticketId', ticketId);
            return;
        }

        const recipientEmail = recipient.get('email');
        if (!recipientEmail) return;

        const emailMsg = new MailerMessage({
            from:    { address: 'kasparas@workbee.space', name: 'WorkBee' },
            to:      [{ address: recipientEmail }],
            subject: `New message from ${senderName} — ${categoryName}`,
            html: `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#f9fafb;border-radius:12px;">
  <h2 style="color:#1d4ed8;margin-bottom:8px;">You have a new message 💬</h2>
  <p style="color:#374151;">Hi <strong>${recipientName}</strong>,</p>
  <p style="color:#374151;"><strong>${senderName}</strong> sent you a message about <strong>${categoryName}</strong>:</p>

  <div style="background:#eff6ff;border-left:4px solid #1d4ed8;padding:14px 16px;border-radius:6px;margin:16px 0;">
    <p style="margin:0;color:#1e3a8a;font-style:italic;">"${text}"</p>
  </div>

  <div style="text-align:center;margin:24px 0;">
    <a href="https://workbee.space/dashboard" style="display:inline-block;background:#1d4ed8;color:#fff;font-weight:700;font-size:15px;padding:12px 28px;border-radius:10px;text-decoration:none;">Reply Now</a>
  </div>
  <p style="color:#6b7280;font-size:12px;margin-top:24px;">You won't receive another email for this conversation for the next 30 minutes.</p>
  <p style="color:#6b7280;font-size:12px;">— WorkBee Team</p>
</div>`,
        });

        $app.newMailClient().send(emailMsg);
        $app.logger().info('message notification sent', 'ticketId', ticketId, 'recipientId', recipientId);

    } catch (err) {
        $app.logger().error('message notification failed', 'error', err.message, 'messageId', msg.id);
    }
}, 'messages');
