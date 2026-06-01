/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  try { app.findCollectionByNameOrId("portfolio_items"); return; } catch (_) {}

  const col = new Collection({
    name: "portfolio_items",
    type: "base",
    fields: [
      new TextField({ name: "contractorId", required: true }),
      new TextField({ name: "title",        required: true }),
      new TextField({ name: "description",  required: false }),
    ],
    listRule:   '@request.auth.id != ""',
    viewRule:   '@request.auth.id != ""',
    createRule: 'contractorId = @request.auth.id',
    updateRule: 'contractorId = @request.auth.id',
    deleteRule: 'contractorId = @request.auth.id',
  });

  app.save(col);
  console.log("portfolio_items created (v5 text-only)");
}, (app) => {
  try { const c = app.findCollectionByNameOrId("portfolio_items"); app.delete(c); } catch (_) {}
});
