/// <reference path="../pb_data/types.d.ts" />

function createNotification(app, userId, type, title, body, link) {
  try {
    const col = app.findCollectionByNameOrId("notifications");
    const rec = new Record(col);
    rec.set("userId", userId);
    rec.set("type",   type);
    rec.set("title",  title);
    rec.set("body",   body  || "");
    rec.set("link",   link  || "");
    rec.set("read",   false);
    app.save(rec);
  } catch (err) {
    app.logger().error("createNotification failed", "error", err.message, "userId", userId);
  }
}

// New bid submitted → notify the client
onRecordAfterCreateSuccess((e) => {
  const bid = e.record;
  try {
    const ticket   = $app.findRecordById("auction_tickets", bid.get("ticketId"));
    const clientId = ticket.get("clientId");
    if (!clientId) return;

    let contractorName = "A contractor";
    try {
      const contractor = $app.findRecordById("users", bid.get("masterId"));
      contractorName   = contractor.get("name") || contractorName;
    } catch (_) {}

    let categoryName = "your request";
    try {
      const cat  = $app.findRecordById("categories", ticket.get("categoryId"));
      categoryName = cat.get("name") || categoryName;
    } catch (_) {}

    createNotification(
      $app,
      clientId,
      "new_bid",
      `New bid on "${categoryName}"`,
      `${contractorName} placed a bid — tap to review it.`,
      `/dashboard/client?tab=active`
    );
  } catch (err) {
    $app.logger().error("in-app new_bid failed", "error", err.message);
  }
}, "bids");

// Bid accepted → notify the contractor
onRecordAfterUpdateSuccess((e) => {
  const bid = e.record;
  if (bid.get("status") !== "accepted") return;

  try {
    const masterId = bid.get("masterId");
    if (!masterId) return;

    const ticket = $app.findRecordById("auction_tickets", bid.get("ticketId"));

    let categoryName = "a job";
    try {
      const cat  = $app.findRecordById("categories", ticket.get("categoryId"));
      categoryName = cat.get("name") || categoryName;
    } catch (_) {}

    createNotification(
      $app,
      masterId,
      "bid_accepted",
      "Your bid was accepted!",
      `The client accepted your bid for "${categoryName}". Reach out to coordinate.`,
      `/dashboard/contractor?tab=active`
    );
  } catch (err) {
    $app.logger().error("in-app bid_accepted failed", "error", err.message);
  }
}, "bids");

// Ticket marked Completed → notify the contractor
onRecordAfterUpdateSuccess((e) => {
  const ticket = e.record;
  if (ticket.get("status") !== "Completed") return;

  try {
    let masterId = "";
    try {
      const bids = $app.findAllRecords("bids",
        $dbx.exp('ticketId = {:id} AND status = "accepted"', { id: ticket.id })
      );
      if (bids.length > 0) masterId = bids[0].get("masterId");
    } catch (_) {}
    if (!masterId) return;

    let categoryName = "a job";
    try {
      const cat  = $app.findRecordById("categories", ticket.get("categoryId"));
      categoryName = cat.get("name") || categoryName;
    } catch (_) {}

    createNotification(
      $app,
      masterId,
      "ticket_completed",
      "Job marked as complete",
      `The client marked "${categoryName}" as completed.`,
      `/dashboard/contractor?tab=completed`
    );
  } catch (err) {
    $app.logger().error("in-app ticket_completed failed", "error", err.message);
  }
}, "auction_tickets");
