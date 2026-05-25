/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  try { app.findCollectionByNameOrId("saved_searches"); return; } catch (_) {}

  const col = new Collection({
    name: "saved_searches",
    type: "base",
    fields: [
      new TextField({ name: "userId",     required: true }),
      new TextField({ name: "label",      required: true }),
      new TextField({ name: "categoryId", required: false }),
      new TextField({ name: "location",   required: false }),
      new TextField({ name: "keyword",    required: false }),
    ],
    listRule:   '@request.auth.id != ""',
    viewRule:   '@request.auth.id != ""',
    createRule: '@request.auth.id != ""',
    updateRule: '@request.auth.id != ""',
    deleteRule: '@request.auth.id != ""',
    indexes: ["CREATE INDEX idx_saved_searches_user ON saved_searches (userId)"],
  });

  app.save(col);
  console.log("saved_searches collection created");
}, (app) => {
  try { const c = app.findCollectionByNameOrId("saved_searches"); app.delete(c); } catch (_) {}
});
