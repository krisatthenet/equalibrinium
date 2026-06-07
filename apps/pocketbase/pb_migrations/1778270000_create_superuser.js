/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  try {
    const email = "kristupas@workbee.space";
    const superusers = app.findCollectionByNameOrId("_superusers");
    const existing = app.findAllRecords("_superusers", $dbx.hashExp({ email }));
    if (existing.length > 0) {
      console.log("Superuser already exists: " + email);
      return;
    }
    // Credentials come from the environment — never hardcode passwords in the repo.
    const password = $os.getenv("PB_SUPERUSER_PASSWORD");
    if (!password) {
      console.log("PB_SUPERUSER_PASSWORD not set; skipping superuser creation for " + email);
      return;
    }
    const record = new Record(superusers);
    record.set("email", email);
    record.set("password", password);
    record.set("passwordConfirm", password);
    app.save(record);
    console.log("Superuser created: " + email);
  } catch (e) {
    console.log("Superuser migration error: " + e.message);
  }
}, (app) => {});
