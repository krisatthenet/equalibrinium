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

        const msg = new MailerMessage({
            from: { address: 'kasparas@workbee.space', name: 'WorkBee' },
            to: [{ address: clientEmail }],
            subject: `Work completed: ${categoryName} — Please review`,
            html: `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#f9fafb;border-radius:12px;">
  <h2 style="color:#059669;margin-bottom:8px;">Work has been marked as completed!</h2>
  <p style="color:#374151;">Hi <strong>${clientName}</strong>,</p>
  <p style="color:#374151;"><strong>${contractorName}</strong> has marked the following job as finished:</p>
  <p style="background:#f0fdf4;border-left:4px solid #059669;padding:12px 16px;border-radius:6px;font-weight:600;color:#065f46;">${categoryName}</p>

  <h3 style="color:#374151;margin-top:24px;">Next steps</h3>
  <ol style="color:#374151;line-height:2;">
    <li>Review the completed work</li>
    <li>Arrange final payment with the contractor</li>
    <li>Leave a review to help others find great contractors</li>
  </ol>

  <p style="color:#374151;margin-top:24px;">Thank you for using WorkBee!</p>
  <p style="color:#6b7280;font-size:13px;margin-top:32px;">— WorkBee Team</p>
</div>`
        });

        $app.newMailClient().send(msg);
        $app.logger().info('completion notification sent', 'ticketId', ticket.id);

    } catch (err) {
        $app.logger().error('completion notification failed', 'error', err.message, 'ticketId', ticket.id);
    }
}, 'auction_tickets');
