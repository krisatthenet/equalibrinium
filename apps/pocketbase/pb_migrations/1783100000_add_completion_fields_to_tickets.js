/// <reference path="../pb_data/types.d.ts" />

// Add completion-photo tracking fields to auction_tickets:
//   contractorMarkedDone — set by contractor when they upload completion photos
//   portfolioItemId      — references the portfolio_items record auto-created on completion

migrate((app) => {
  try {
    const tickets = app.findCollectionByNameOrId("auction_tickets");

    try { tickets.fields.getByName("contractorMarkedDone"); } catch (_) {
      tickets.fields.add(new BoolField({ name: "contractorMarkedDone", required: false }));
    }

    try { tickets.fields.getByName("portfolioItemId"); } catch (_) {
      tickets.fields.add(new TextField({ name: "portfolioItemId", required: false }));
    }

    app.save(tickets);
    console.log("auction_tickets: added contractorMarkedDone + portfolioItemId");
  } catch (e) {
    console.error("add_completion_fields failed:", String(e));
  }
}, (app) => {
  try {
    const tickets = app.findCollectionByNameOrId("auction_tickets");
    try { tickets.fields.removeByName("contractorMarkedDone"); } catch (_) {}
    try { tickets.fields.removeByName("portfolioItemId"); } catch (_) {}
    app.save(tickets);
  } catch (_) {}
});
