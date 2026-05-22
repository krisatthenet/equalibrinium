/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("users");

  const existing = collection.fields.getByName("userType");
  if (existing) {
    if (existing.type === "select") {
      return; // field already exists with correct type, skip
    }
    collection.fields.removeByName("userType"); // exists with wrong type, remove first
  }

  collection.fields.add(new SelectField({
    name: "userType",
    values: ["client", "contractor", "master", "influencer"]
  }));

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("users");
  collection.fields.removeByName("userType");
  return app.save(collection);
})