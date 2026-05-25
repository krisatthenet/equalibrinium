/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const users = app.findCollectionByNameOrId("users");
  users.fields.add(new TextField({
    name: "serviceRadius",
    required: false,
    max: 20,
  }));
  app.save(users);
  console.log("serviceRadius field added to users");
}, (app) => {
  const users = app.findCollectionByNameOrId("users");
  users.fields.removeByName("serviceRadius");
  app.save(users);
});
