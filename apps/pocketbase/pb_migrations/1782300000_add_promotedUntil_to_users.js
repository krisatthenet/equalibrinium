/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const users = app.findCollectionByNameOrId("users");
  try { users.fields.getByName("promotedUntil"); return; } catch (_) {}
  users.fields.add(new TextField({ name: "promotedUntil", required: false }));
  app.save(users);
  console.log("promotedUntil added to users");
}, (app) => {
  const users = app.findCollectionByNameOrId("users");
  try { users.fields.removeByName("promotedUntil"); } catch (_) {}
  app.save(users);
});
