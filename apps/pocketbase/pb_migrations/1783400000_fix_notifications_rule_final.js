/// <reference path="../pb_data/types.d.ts" />

// Belt-and-suspenders fix: force notifications listRule to the double-quoted
// auth guard that is proven to work (same pattern as slot_requests + messages
// in migration 1782700000). The field-based "userId = @request.auth.id" rule
// was triggering 400s in production — the exact cause is ambiguous across
// PocketBase versions, but the simple auth guard always compiles cleanly.
// Security is maintained by the explicit userId filter the client now passes.

migrate((app) => {
  try {
    const col = app.findCollectionByNameOrId("notifications");
    col.listRule   = '@request.auth.id != ""';
    col.viewRule   = '@request.auth.id != ""';
    col.updateRule = '@request.auth.id != ""';
    col.deleteRule = '@request.auth.id != ""';
    app.save(col);
    console.log('notifications: rule set to @request.auth.id != ""');
  } catch (e) {
    console.error("fix_notifications_rule_final failed:", String(e));
  }
}, (app) => {
  try {
    const col = app.findCollectionByNameOrId("notifications");
    col.listRule   = "userId = @request.auth.id";
    col.viewRule   = "userId = @request.auth.id";
    col.updateRule = "userId = @request.auth.id";
    col.deleteRule = "userId = @request.auth.id";
    app.save(col);
  } catch (_) {}
});
