/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("users");

  const existing = collection.fields.getByName("title");
  if (existing) return;

  collection.fields.add(new TextField({
    name: "title",
    required: false,
    max: 100,
  }));

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("users");
  collection.fields.removeByName("title");
  return app.save(collection);
})
