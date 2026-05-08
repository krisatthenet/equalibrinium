/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  try {
    const superusers = app.findCollectionByNameOrId("_superusers");
    const existing = app.findAllRecords("_superusers", $dbx.hashExp({ email: "kristupas@workbee.space" }));
    if (existing.length === 0) {
      const record = new Record(superusers);
      record.set("email", "kristupas@workbee.space");
      record.set("password", "WorkBee2026!");
      record.set("passwordConfirm", "WorkBee2026!");
      app.save(record);
      console.log("Superuser created: kristupas@workbee.space");
    } else {
      console.log("Superuser already exists");
    }
  } catch (e) {
    console.log("Superuser migration error: " + e.message);
  }
}, (app) => {});
