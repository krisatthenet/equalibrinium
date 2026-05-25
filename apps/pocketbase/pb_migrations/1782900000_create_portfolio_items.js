/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  try {
    app.findCollectionByNameOrId("portfolio_items");
    console.log("portfolio_items already exists, skipping");
    return;
  } catch (_) {}

  try {
    const col = new Collection();
    col.name = "portfolio_items";
    col.type = "base";

    col.fields.add({ type: "text", name: "contractorId", required: true });
    col.fields.add({ type: "text", name: "title",        required: true });
    col.fields.add({ type: "text", name: "description",  required: false });
    col.fields.add(new FileField({ name: "beforePhotos", maxSelect: 5, maxSize: 10485760 }));
    col.fields.add(new FileField({ name: "afterPhotos",  maxSelect: 5, maxSize: 10485760 }));

    col.listRule  = "";
    col.viewRule  = "";
    col.createRule = '@request.auth.id != ""';
    col.updateRule = 'contractorId = @request.auth.id';
    col.deleteRule = 'contractorId = @request.auth.id';

    app.save(col);
    console.log("portfolio_items collection created");
  } catch (e) {
    console.error("create_portfolio_items failed: " + String(e));
  }
}, (app) => {
  try {
    const col = app.findCollectionByNameOrId("portfolio_items");
    app.delete(col);
  } catch (_) {}
});
