/// <reference path="../pb_data/types.d.ts" />

// notifications, messages, and saved_searches were created without explicit
// created/updated AutodateField entries. PocketBase v0.36 requires these to
// be present to support sort=-created (without them the query returns 400).
migrate((app) => {
  const targets = ["notifications", "messages", "saved_searches"];

  for (const name of targets) {
    try {
      const col = app.findCollectionByNameOrId(name);

      // Remove first in case of a partial prior run, then re-add.
      try { col.fields.removeByName("created"); } catch (_) {}
      try { col.fields.removeByName("updated"); } catch (_) {}

      col.fields.add(new AutodateField({
        name:     "created",
        onCreate: true,
        onUpdate: false,
      }));
      col.fields.add(new AutodateField({
        name:     "updated",
        onCreate: true,
        onUpdate: true,
      }));

      app.save(col);
      console.log(name + ": created/updated autodate fields added");
    } catch (err) {
      console.error("add-timestamps failed for " + name + ": " + err.message);
    }
  }
}, (app) => {
  // Autodate fields are low-risk to leave; rolling back is a no-op.
});
