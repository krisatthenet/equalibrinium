/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("masters");
  collection.name = "contractors";
  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("contractors");
  collection.name = "masters";
  return app.save(collection);
})