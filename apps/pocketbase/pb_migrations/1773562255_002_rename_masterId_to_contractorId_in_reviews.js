/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("reviews");
  const field = collection.fields.getByName("masterId");
  field.name = "contractorId";
  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("reviews");
  const field = collection.fields.getByName("contractorId");
  field.name = "masterId";
  return app.save(collection);
})