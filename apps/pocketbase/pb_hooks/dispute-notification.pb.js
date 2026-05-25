/// <reference path="../pb_data/types.d.ts" />

onRecordAfterCreateSuccess((e) => {
    const record = e.record;
    if (record.get("source") !== "dispute") return;

    const clientName  = record.get("name")    || "A client";
    const clientEmail = record.get("email")   || "—";
    const ticketId    = record.get("ticketId") || "—";
    const message     = record.get("message") || "";
    const subject     = record.get("subject") || "Dispute raised";

    let ticketDesc = "";
    try {
        const ticket = $app.findRecordById("auction_tickets", ticketId);
        ticketDesc = ticket.get("description") || "";
    } catch (_) {}

    const html = `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#fff3f3;border-radius:12px;border:2px solid #ef4444;">
  <h2 style="color:#dc2626;margin-bottom:4px;">🚨 Dispute Raised</h2>
  <p style="color:#374151;margin-bottom:16px;">A client has raised a dispute that requires your attention.</p>

  <table style="width:100%;border-collapse:collapse;background:#fff;border-radius:8px;overflow:hidden;margin-bottom:16px;">
    <tr style="background:#f1f5f9;">
      <td style="padding:10px 14px;font-weight:600;color:#374151;width:40%">Client</td>
      <td style="padding:10px 14px;color:#374151">${clientName}</td>
    </tr>
    <tr>
      <td style="padding:10px 14px;font-weight:600;color:#374151">Email</td>
      <td style="padding:10px 14px;color:#374151">${clientEmail}</td>
    </tr>
    <tr style="background:#f1f5f9;">
      <td style="padding:10px 14px;font-weight:600;color:#374151">Ticket ID</td>
      <td style="padding:10px 14px;color:#374151">${ticketId}</td>
    </tr>
    <tr>
      <td style="padding:10px 14px;font-weight:600;color:#374151">Job Description</td>
      <td style="padding:10px 14px;color:#374151">${ticketDesc || "—"}</td>
    </tr>
  </table>

  <div style="background:#fee2e2;border-left:4px solid #dc2626;padding:14px 16px;border-radius:6px;margin-bottom:20px;">
    <p style="font-weight:600;color:#991b1b;margin:0 0 6px;">Dispute Reason:</p>
    <p style="color:#374151;margin:0;">${message}</p>
  </div>

  <a href="https://workbee.space/admin/support" style="display:inline-block;background:#dc2626;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">
    Review Dispute in Admin Panel →
  </a>
</div>`;

    try {
        const msg = new MailerMessage({
            from: { address: "kasparas@workbee.space", name: "WorkBee" },
            to:   [{ address: "admin@workbee.space" }],
            subject: `🚨 Dispute: ${subject}`,
            html,
        });
        $app.newMailClient().send(msg);
    } catch (err) {
        console.error("dispute-notification: failed to send email:", err);
    }
}, "cs_tickets");
