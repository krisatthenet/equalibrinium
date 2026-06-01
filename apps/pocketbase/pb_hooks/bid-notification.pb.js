/// <reference path="../pb_data/types.d.ts" />

function sendBidAcceptedEmails(bid) {
    try {
        const contractor = $app.findRecordById('users', bid.get('masterId'));
        const ticket     = $app.findRecordById('auction_tickets', bid.get('ticketId'));
        const client     = $app.findRecordById('users', ticket.get('clientId'));

        let categoryName = 'Service Request';
        try {
            const category = $app.findRecordById('categories', ticket.get('categoryId'));
            categoryName   = category.get('name');
        } catch (_) {}

        const contractorName  = contractor.get('name')  || 'Contractor';
        const contractorEmail = contractor.get('email');
        const contractorPhone = contractor.get('phone') || 'Not provided';

        const clientName  = client.get('name')  || 'Client';
        const clientEmail = client.get('email');
        const clientPhone = client.get('phone') || 'Not provided';

        const rate = bid.get('proposedRate');

        // --- Email to client ---
        const clientMsg = new MailerMessage({
            from: { address: 'kasparas@workbee.space', name: 'WorkBee' },
            to:   [{ address: clientEmail }],
            subject: `Bid Accepted: ${categoryName}`,
            html: `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#f9fafb;border-radius:12px;">
  <h2 style="color:#1d4ed8;margin-bottom:8px;">You accepted a bid!</h2>
  <p style="color:#374151;">Hi <strong>${clientName}</strong>,</p>
  <p style="color:#374151;">You accepted a bid for your service request:</p>
  <p style="background:#eff6ff;border-left:4px solid #1d4ed8;padding:12px 16px;border-radius:6px;font-weight:600;color:#1e40af;">${categoryName}</p>

  <h3 style="color:#374151;margin-top:24px;">Contractor Contact Details</h3>
  <table style="width:100%;border-collapse:collapse;">
    <tr><td style="padding:8px 0;color:#6b7280;width:120px;">Name</td><td style="padding:8px 0;font-weight:600;color:#111827;">${contractorName}</td></tr>
    <tr><td style="padding:8px 0;color:#6b7280;">Email</td><td style="padding:8px 0;"><a href="mailto:${contractorEmail}" style="color:#1d4ed8;">${contractorEmail}</a></td></tr>
    <tr><td style="padding:8px 0;color:#6b7280;">Phone</td><td style="padding:8px 0;"><a href="tel:${contractorPhone}" style="color:#1d4ed8;">${contractorPhone}</a></td></tr>
    <tr><td style="padding:8px 0;color:#6b7280;">Rate</td><td style="padding:8px 0;font-weight:700;color:#059669;">€${rate}</td></tr>
  </table>

  <p style="color:#374151;margin-top:24px;">Please contact the contractor to discuss the job details and agree on a start date.</p>
  <p style="color:#6b7280;font-size:13px;margin-top:32px;">— WorkBee Team</p>
</div>`
        });

        // --- Email to contractor ---
        const contractorMsg = new MailerMessage({
            from: { address: 'kasparas@workbee.space', name: 'WorkBee' },
            to:   [{ address: contractorEmail }],
            subject: `Your bid was accepted! — ${categoryName}`,
            html: `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#f9fafb;border-radius:12px;">
  <h2 style="color:#059669;margin-bottom:8px;">Congratulations! Your bid was accepted.</h2>
  <p style="color:#374151;">Hi <strong>${contractorName}</strong>,</p>
  <p style="color:#374151;">The client accepted your bid of <strong>€${rate}</strong> for:</p>
  <p style="background:#f0fdf4;border-left:4px solid #059669;padding:12px 16px;border-radius:6px;font-weight:600;color:#065f46;">${categoryName}</p>

  <h3 style="color:#374151;margin-top:24px;">Client Contact Details</h3>
  <table style="width:100%;border-collapse:collapse;">
    <tr><td style="padding:8px 0;color:#6b7280;width:120px;">Name</td><td style="padding:8px 0;font-weight:600;color:#111827;">${clientName}</td></tr>
    <tr><td style="padding:8px 0;color:#6b7280;">Email</td><td style="padding:8px 0;"><a href="mailto:${clientEmail}" style="color:#1d4ed8;">${clientEmail}</a></td></tr>
    <tr><td style="padding:8px 0;color:#6b7280;">Phone</td><td style="padding:8px 0;"><a href="tel:${clientPhone}" style="color:#1d4ed8;">${clientPhone}</a></td></tr>
  </table>

  <p style="color:#374151;margin-top:24px;">Please reach out to the client to coordinate the work schedule and location.</p>
  <p style="color:#6b7280;font-size:13px;margin-top:32px;">— WorkBee Team</p>
</div>`
        });

        $app.newMailClient().send(clientMsg);
        $app.newMailClient().send(contractorMsg);

        $app.logger().info('bid acceptance notifications sent', 'bidId', bid.id);

    } catch (err) {
        $app.logger().error('bid notification failed', 'error', err.message, 'bidId', bid.id);
    }
}

// Normal bid flow: bid updated to "accepted" by the bid-acceptance hook
onRecordAfterUpdateSuccess((e) => {
    if (e.record.get('status') === 'accepted') {
        sendBidAcceptedEmails(e.record);
    }
}, 'bids');

// Direct request flow: bid created already-accepted (handleAcceptDirect in ContractorDashboard)
onRecordAfterCreateSuccess((e) => {
    if (e.record.get('status') === 'accepted') {
        sendBidAcceptedEmails(e.record);
    }
}, 'bids');
