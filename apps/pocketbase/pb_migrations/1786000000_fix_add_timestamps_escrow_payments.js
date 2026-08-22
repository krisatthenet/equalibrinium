/// <reference path="../pb_data/types.d.ts" />

// escrow_payments was created with a raw fields array
// (1782600000_create_escrow_payments.js) that didn't include created/updated
// — same root cause as 1785900000_fix_add_timestamps_payments.js. Surfaced as
// a live 500 on GET /stripe/escrow-status, which sorts by "-created"
// (PocketBase v0.36 requires the field to exist to sort/filter on it).
migrate((app) => {
  try {
    const col = app.findCollectionByNameOrId("escrow_payments");

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
    console.log("escrow_payments: created/updated autodate fields added");
  } catch (err) {
    console.error("fix-timestamps failed for escrow_payments: " + err.message);
  }
}, (app) => {
  // Rollback is a no-op — removing autodate fields would break existing data.
});
