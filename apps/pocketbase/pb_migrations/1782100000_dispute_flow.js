/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  // 1. Add disputedAt to auction_tickets
  const tickets = app.findCollectionByNameOrId("auction_tickets");
  try { tickets.fields.getByName("disputedAt"); } catch (_) {
    tickets.fields.add(new TextField({ name: "disputedAt", required: false }));
  }
  app.save(tickets);

  // 2. Update cs_tickets — add "dispute" source option + ticketId field
  const cs = app.findCollectionByNameOrId("cs_tickets");

  try { cs.fields.getByName("ticketId"); } catch (_) {
    cs.fields.add(new TextField({ name: "ticketId", required: false }));
  }

  const sourceField = cs.fields.getByName("source");
  if (sourceField && !sourceField.values.includes("dispute")) {
    sourceField.values = ["widget", "email", "phone", "manual", "dispute"];
  }

  app.save(cs);
  console.log("dispute_flow: added disputedAt to auction_tickets, dispute source + ticketId to cs_tickets");
}, (app) => {
  const tickets = app.findCollectionByNameOrId("auction_tickets");
  try { tickets.fields.removeByName("disputedAt"); } catch (_) {}
  app.save(tickets);

  const cs = app.findCollectionByNameOrId("cs_tickets");
  try { cs.fields.removeByName("ticketId"); } catch (_) {}
  const sourceField = cs.fields.getByName("source");
  if (sourceField) {
    sourceField.values = ["widget", "email", "phone", "manual"];
  }
  app.save(cs);
});
