/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  try { app.findCollectionByNameOrId("escrow_payments"); return; } catch (_) {}

  const col = new Collection({
    name: "escrow_payments",
    type: "base",
    fields: [
      { type: "text",   name: "ticketId",              required: true },
      { type: "text",   name: "bidId",                 required: true },
      { type: "text",   name: "clientId",              required: true },
      { type: "text",   name: "contractorId",          required: true },
      { type: "number", name: "amount",                required: true },
      { type: "text",   name: "stripePaymentIntentId", required: true },
      { type: "text",   name: "stripeSessionId" },
      { type: "select", name: "status", required: true,
        values: ["pending_payment", "held", "released", "refunded", "cancelled"], maxSelect: 1 },
    ],
    listRule:   "@request.auth.id != ''",
    viewRule:   "@request.auth.id != ''",
    createRule: null,
    updateRule: null,
    deleteRule: null,
  });

  app.save(col);
  console.log("escrow_payments collection created");
}, (app) => {
  try {
    const col = app.findCollectionByNameOrId("escrow_payments");
    app.delete(col);
  } catch (_) {}
});
