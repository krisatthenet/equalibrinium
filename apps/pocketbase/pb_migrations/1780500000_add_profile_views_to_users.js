/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("users");

  const field = new Field({
    type: "number",
    name: "profileViews",
    required: false,
    min: 0,
  });

  collection.fields.add(field);
  app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("users");
  collection.fields.removeByName("profileViews");
  app.save(collection);
});
