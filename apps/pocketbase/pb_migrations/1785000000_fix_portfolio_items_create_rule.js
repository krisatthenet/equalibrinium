/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const col = app.findCollectionByNameOrId("portfolio_items");
  col.createRule = 'contractorId = @request.auth.id';
  app.save(col);
  console.log("portfolio_items createRule tightened");
}, (app) => {
  const col = app.findCollectionByNameOrId("portfolio_items");
  col.createRule = '@request.auth.id != ""';
  app.save(col);
});
