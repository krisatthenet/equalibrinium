/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("users");
  collection.fields.removeByName("profilePicture");
  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("users");
  collection.fields.add(new FileField({
    name: "profilePicture",
    maxSelect: 1,
    maxSize: 20971520
  }));
  return app.save(collection);
});
