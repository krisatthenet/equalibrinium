/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  try {
    app.findCollectionByNameOrId("portfolio_items");
    return; // already exists
  } catch (_) {}

  try {
    const col = new Collection({
      name: "portfolio_items",
      type: "base",
      fields: [
        new TextField({ name: "contractorId", required: true }),
        new TextField({ name: "title",        required: true }),
        new TextField({ name: "description",  required: false }),
        new FileField({ name: "beforePhotos", maxSelect: 5, maxSize: 10485760 }),
        new FileField({ name: "afterPhotos",  maxSelect: 5, maxSize: 10485760 }),
      ],
      listRule:   "",
      viewRule:   "",
      createRule: '@request.auth.id != ""',
      updateRule: "contractorId = @request.auth.id",
      deleteRule: "contractorId = @request.auth.id",
    });
    app.save(col);
    console.log("portfolio_items created (v4 with FileField)");
  } catch (e1) {
    console.error("portfolio_items v4 FileField attempt failed: " + String(e1));
    // Fallback: create without file fields, then add them
    try {
      const col2 = new Collection({
        name: "portfolio_items",
        type: "base",
        fields: [
          new TextField({ name: "contractorId", required: true }),
          new TextField({ name: "title",        required: true }),
          new TextField({ name: "description",  required: false }),
        ],
        listRule:   "",
        viewRule:   "",
        createRule: '@request.auth.id != ""',
        updateRule: "contractorId = @request.auth.id",
        deleteRule: "contractorId = @request.auth.id",
      });
      app.save(col2);
      console.log("portfolio_items created (v4 fallback, text-only)");
    } catch (e2) {
      console.error("portfolio_items v4 fallback also failed: " + String(e2));
    }
  }
}, (app) => {
  try { const c = app.findCollectionByNameOrId("portfolio_items"); app.delete(c); } catch (_) {}
});
