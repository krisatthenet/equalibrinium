/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  try {
    const superusers = app.findCollectionByNameOrId("_superusers");
    const existing = app.findAllRecords("_superusers", $dbx.hashExp({ email: "admin@workbee.space" }));
    if (existing.length === 0) {
      const record = new Record(superusers);
      record.set("email", "admin@workbee.space");
      record.set("password", "Rapolas123!");
      record.set("passwordConfirm", "Rapolas123!");
      app.save(record);
      console.log("Superuser created: admin@workbee.space");
    } else {
      console.log("Superuser admin@workbee.space already exists");
    }
  } catch (e) {
    console.log("Superuser migration error: " + e.message);
  }
}, (app) => {});
