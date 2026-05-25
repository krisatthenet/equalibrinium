/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const col = app.findCollectionByNameOrId("users");

  try { col.fields.getByName("idVerified"); } catch (_) {
    col.fields.add(new BoolField({ name: "idVerified", required: false }));
  }

  app.save(col);
  console.log("users: added idVerified field");
}, (app) => {
  const col = app.findCollectionByNameOrId("users");
  try { col.fields.removeByName("idVerified"); } catch (_) {}
  app.save(col);
});
