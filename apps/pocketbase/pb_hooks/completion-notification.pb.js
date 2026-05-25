/// <reference path="../pb_data/types.d.ts" />

onRecordAfterUpdateSuccess((e) => {
    const ticket = e.record;

    if (ticket.get('status') !== 'Completed') return;

    try {
        const client = $app.findRecordById('users', ticket.get('clientId'));

        let contractorName = 'Your contractor';
        let categoryName = 'Service Request';

        try {
            const bids = $app.findAllRecords('bids', $dbx.exp('ticketId = {:id} AND status = "accepted"', { id: ticket.id }));
            if (bids.length > 0) {
                const contractor = $app.findRecordById('users', bids[0].get('masterId'));
                contractorName = contractor.get('name') || contractorName;
            }
        } catch (_) {}

        try {
            const category = $app.findRecordById('categories', ticket.get('categoryId'));
            categoryName = category.get('name') || categoryName;
        } catch (_) {}

        const clientEmail = client.get('email');
        const clientName = client.get('name') || 'Client';

        const reviewUrl = `https://workbee.space/dashboard?tab=completed&review=${ticket.id}`;

        const msg = new MailerMessage({
            from: { address: 'kasparas@workbee.space', name: 'WorkBee' },
            to: [{ address: clientEmail }],
            subject: `Work completed: ${categoryName} — Leave a review`,
            html: `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#0a0a0a;border-radius:12px;border:1px solid #1f1f1f;">
  <div style="text-align:center;margin-bottom:24px;">
    <span style="display:inline-block;background:#facc15;color:#000;font-weight:700;font-size:18px;padding:6px 16px;border-radius:9999px;letter-spacing:-0.5px;">WorkBee</span>
  </div>
  <h2 style="color:#4ade80;margin-bottom:8px;font-size:22px;">Job marked as complete ✓</h2>
  <p style="color:#e5e5e5;">Hi <strong>${clientName}</strong>,</p>
  <p style="color:#a3a3a3;"><strong style="color:#e5e5e5;">${contractorName}</strong> has marked your job as finished:</p>
  <p style="background:#052e16;border-left:4px solid #4ade80;padding:12px 16px;border-radius:6px;font-weight:600;color:#4ade80;margin:16px 0;">${categoryName}</p>

  <p style="color:#a3a3a3;margin-top:16px;">Reviews are the backbone of WorkBee — they help other clients find great contractors and reward professionals who do excellent work.</p>

  <div style="text-align:center;margin:28px 0;">
    <a href="${reviewUrl}" style="display:inline-block;background:#facc15;color:#000;font-weight:700;font-size:15px;padding:14px 32px;border-radius:9999px;text-decoration:none;">
      ⭐ Leave a Review
    </a>
  </div>

  <p style="color:#737373;font-size:13px;margin-top:32px;border-top:1px solid #1f1f1f;padding-top:16px;">If you have any issues with the completed work, you can raise a dispute from your <a href="https://workbee.space/dashboard?tab=completed" style="color:#facc15;">dashboard</a>.</p>
  <p style="color:#525252;font-size:12px;">— WorkBee Team</p>
</div>`
        });

        $app.newMailClient().send(msg);
        $app.logger().info('completion notification sent', 'ticketId', ticket.id);

    } catch (err) {
        $app.logger().error('completion notification failed', 'error', err.message, 'ticketId', ticket.id);
    }
}, 'auction_tickets');
