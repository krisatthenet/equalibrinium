/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  try {
    app.findCollectionByNameOrId("availability");
    console.log("availability collection already exists");
    return;
  } catch (_) {}

  const collection = new Collection({
    name: "availability",
    type: "base",
    fields: [
      { type: "text", name: "contractorId", required: true },
      { type: "text", name: "date",         required: true }, // YYYY-MM-DD
      { type: "text", name: "note" },
    ],
    listRule:   "@request.auth.id != ''",
    viewRule:   "@request.auth.id != ''",
    createRule: "@request.auth.id != '' && @request.body.contractorId = @request.auth.id",
    updateRule: "@request.auth.id != '' && contractorId = @request.auth.id",
    deleteRule: "@request.auth.id != '' && contractorId = @request.auth.id",
    indexes: [
      "CREATE UNIQUE INDEX idx_availability_contractor_date ON availability (contractorId, date)",
    ],
  });

  app.save(collection);
  console.log("availability collection created");
}, (app) => {
  try {
    const col = app.findCollectionByNameOrId("availability");
    app.delete(col);
  } catch (_) {}
});
