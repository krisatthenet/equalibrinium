/// <reference path="../pb_data/types.d.ts" />

// notifications, messages, and saved_searches were created without explicit
// created/updated AutodateField entries. PocketBase v0.36 requires these to
// be present to support sort=-created (without them the query returns 400).
migrate((app) => {
  const targets = ["notifications", "messages", "saved_searches"];

  for (const name of targets) {
    try {
      const col = app.findCollectionByNameOrId(name);

      let hasCreated = false;
      let hasUpdated = false;
      for (const f of col.fields.all()) {
        if (f.name === "created") hasCreated = true;
        if (f.name === "updated") hasUpdated = true;
      }

      if (!hasCreated) {
        col.fields.add(new AutodateField({
          name:     "created",
          onCreate: true,
          onUpdate: false,
        }));
      }
      if (!hasUpdated) {
        col.fields.add(new AutodateField({
          name:     "updated",
          onCreate: true,
          onUpdate: true,
        }));
      }

      if (!hasCreated || !hasUpdated) {
        app.save(col);
        console.log(name + ": created/updated autodate fields added");
      } else {
        console.log(name + ": created/updated already present, skipping");
      }
    } catch (err) {
      console.error("add-timestamps failed for " + name + ": " + err.message);
    }
  }
}, (app) => {
  // Autodate fields are low-risk to leave; rolling back is a no-op.
});
