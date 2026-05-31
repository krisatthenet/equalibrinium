/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  try { app.findCollectionByNameOrId("portfolio_items"); return; } catch (_) {}

  const col = new Collection({
    name: "portfolio_items",
    type: "base",
    fields: [
      { type: "text", name: "contractorId", required: true },
      { type: "text", name: "title",        required: true },
      { type: "text", name: "description",  required: false },
      { type: "file", name: "beforePhotos", maxSelect: 5, maxSize: 10485760 },
      { type: "file", name: "afterPhotos",  maxSelect: 5, maxSize: 10485760 },
    ],
    listRule:   "",
    viewRule:   "",
    createRule: '@request.auth.id != ""',
    updateRule: 'contractorId = @request.auth.id',
    deleteRule: 'contractorId = @request.auth.id',
  });

  app.save(col);
  console.log("portfolio_items collection created (v3)");
}, (app) => {
  try { const c = app.findCollectionByNameOrId("portfolio_items"); app.delete(c); } catch (_) {}
});
