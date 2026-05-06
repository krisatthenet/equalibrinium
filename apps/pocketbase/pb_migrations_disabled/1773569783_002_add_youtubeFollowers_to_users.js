/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("users");

  const existing = collection.fields.getByName("youtubeFollowers");
  if (existing) {
    if (existing.type === "number") {
      return; // field already exists with correct type, skip
    }
    collection.fields.removeByName("youtubeFollowers"); // exists with wrong type, remove first
  }

  collection.fields.add(new NumberField({
    name: "youtubeFollowers",
    required: false
  }));

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("users");
  collection.fields.removeByName("youtubeFollowers");
  return app.save(collection);
})