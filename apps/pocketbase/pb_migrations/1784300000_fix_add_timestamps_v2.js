/// <reference path="../pb_data/types.d.ts" />

// Migration 1784200000 was marked applied after its .all() calls errored
// silently inside try/catch without actually adding the fields.
// This migration performs the same work correctly.
migrate((app) => {
  const targets = ["notifications", "messages", "saved_searches"];

  for (const name of targets) {
    try {
      const col = app.findCollectionByNameOrId(name);

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
      throw new Error("fix-timestamps failed for " + name + ": " + err.message);
    }
  }
}, (app) => {
  // Rollback is a no-op — removing autodate fields would break existing data.
});
