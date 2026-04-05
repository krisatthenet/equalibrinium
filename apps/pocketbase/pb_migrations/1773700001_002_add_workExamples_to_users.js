/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("users");

  const existing = collection.fields.getByName("workExamples");
  if (existing) return;

  collection.fields.add(new FileField({
    name: "workExamples",
    maxSelect: 20,
    maxSize: 5242880
  }));

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("users");
  collection.fields.removeByName("workExamples");
  return app.save(collection);
})
