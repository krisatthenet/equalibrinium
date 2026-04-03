/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("users");

  const existing = collection.fields.getByName("tiktokFollowers");
  if (existing) {
    if (existing.type === "number") {
      return; // field already exists with correct type, skip
    }
    collection.fields.removeByName("tiktokFollowers"); // exists with wrong type, remove first
  }

  collection.fields.add(new NumberField({
    name: "tiktokFollowers",
    required: false
  }));

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("users");
  collection.fields.removeByName("tiktokFollowers");
  return app.save(collection);
})