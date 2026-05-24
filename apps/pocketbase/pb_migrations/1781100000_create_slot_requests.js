/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  try {
    app.findCollectionByNameOrId("slot_requests");
    console.log("slot_requests collection already exists");
    return;
  } catch (_) {}

  const collection = new Collection({
    name: "slot_requests",
    type: "base",
    fields: [
      { type: "text", name: "contractorId", required: true },
      { type: "text", name: "clientId",     required: true },
      { type: "text", name: "clientName" },
      { type: "text", name: "date",         required: true }, // YYYY-MM-DD
      { type: "text", name: "message" },
      { type: "select", name: "status", values: ["pending", "confirmed", "declined"], maxSelect: 1, required: true },
      { type: "text", name: "ticketId" }, // optional link to a ticket
    ],
    // both parties can list/view their own requests
    listRule:   "@request.auth.id != '' && (contractorId = @request.auth.id || clientId = @request.auth.id)",
    viewRule:   "@request.auth.id != '' && (contractorId = @request.auth.id || clientId = @request.auth.id)",
    createRule: "@request.auth.id != '' && @request.body.clientId = @request.auth.id",
    // only the contractor can confirm/decline
    updateRule: "@request.auth.id != '' && contractorId = @request.auth.id",
    deleteRule: "@request.auth.id != '' && clientId = @request.auth.id",
  });

  app.save(collection);
  console.log("slot_requests collection created");
}, (app) => {
  try {
    const col = app.findCollectionByNameOrId("slot_requests");
    app.delete(col);
  } catch (_) {}
});
