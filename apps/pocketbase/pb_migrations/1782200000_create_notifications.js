/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  try { app.findCollectionByNameOrId("notifications"); return; } catch (_) {}

  const col = new Collection({
    name: "notifications",
    type: "base",
    fields: [
      { type: "text",   name: "userId",   required: true },
      { type: "select", name: "type",     values: ["new_bid", "bid_accepted", "ticket_completed", "dispute_update"], maxSelect: 1 },
      { type: "text",   name: "title",    required: true },
      { type: "text",   name: "body" },
      { type: "text",   name: "link" },
      { type: "bool",   name: "read" },
    ],
    listRule:   "userId = @request.auth.id",
    viewRule:   "userId = @request.auth.id",
    updateRule: "userId = @request.auth.id",
    deleteRule: "userId = @request.auth.id",
    createRule: null,
  });

  app.save(col);
  console.log("notifications collection created");
}, (app) => {
  try { const c = app.findCollectionByNameOrId("notifications"); app.delete(c); } catch (_) {}
});
