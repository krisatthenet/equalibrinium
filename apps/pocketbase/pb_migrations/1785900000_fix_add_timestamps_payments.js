/// <reference path="../pb_data/types.d.ts" />

// payments was created (1779700000_create_payments_collection.js) via the
// same incremental Collection() pattern that left notifications/messages/
// saved_searches without explicit created/updated AutodateFields — see
// 1784200000_add_timestamps_to_dynamic_collections.js. PocketBase v0.36
// requires these to be present to filter/sort by them (otherwise 400).
migrate((app) => {
  try {
    const col = app.findCollectionByNameOrId("payments");

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
    console.log("payments: created/updated autodate fields added");
  } catch (err) {
    console.error("fix-timestamps failed for payments: " + err.message);
  }
}, (app) => {
  // Rollback is a no-op — removing autodate fields would break existing data.
});
