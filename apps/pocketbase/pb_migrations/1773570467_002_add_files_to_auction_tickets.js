/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("auction_tickets");

  const existing = collection.fields.getByName("files");
  if (existing) {
    if (existing.type === "file") {
      return; // field already exists with correct type, skip
    }
    collection.fields.removeByName("files"); // exists with wrong type, remove first
  }

  collection.fields.add(new FileField({
    name: "files",
    maxSelect: 10,
    maxSize: 5242880
  }));

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("auction_tickets");
  collection.fields.removeByName("files");
  return app.save(collection);
})