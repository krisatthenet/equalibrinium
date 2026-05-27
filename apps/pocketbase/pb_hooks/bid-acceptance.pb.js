/// <reference path="../pb_data/types.d.ts" />

// When a ticket moves to "In Progress" with acceptedBidId set, update bid
// statuses server-side. Clients cannot update bids directly because the bids
// updateRule restricts writes to the bid's masterId.
onRecordAfterUpdateSuccess((e) => {
  const ticket = e.record;
  if (ticket.get("status") !== "In Progress") return;

  const acceptedBidId = ticket.get("acceptedBidId");
  if (!acceptedBidId) return;

  const ticketId = ticket.id;

  try {
    const acceptedBid = $app.findRecordById("bids", acceptedBidId);
    if (acceptedBid.get("status") !== "accepted") {
      acceptedBid.set("status", "accepted");
      $app.save(acceptedBid);
    }
  } catch (err) {
    $app.logger().error("bid-acceptance: accept failed", "error", err.message, "bidId", acceptedBidId);
  }

  try {
    const otherBids = $app.findAllRecords("bids",
      $dbx.exp(`ticketId = {:tid} AND id != {:bid} AND status = 'pending'`, { tid: ticketId, bid: acceptedBidId })
    );
    for (const bid of otherBids) {
      bid.set("status", "rejected");
      $app.save(bid);
    }
  } catch (err) {
    $app.logger().error("bid-acceptance: reject others failed", "error", err.message, "ticketId", ticketId);
  }
}, "auction_tickets");
