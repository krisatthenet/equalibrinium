/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("masters");

  const existing = collection.fields.getByName("profession");
  if (existing) {
    if (existing.type === "text") {
      return; // field already exists with correct type, skip
    }
    collection.fields.removeByName("profession"); // exists with wrong type, remove first
  }

  collection.fields.add(new TextField({
    name: "profession",
    required: true
  }));

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("masters");
  collection.fields.removeByName("profession");
  return app.save(collection);
})