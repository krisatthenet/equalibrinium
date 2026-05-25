/// <reference path="../pb_data/types.d.ts" />

// Ensure notifications collection has a valid field-based rule.
// Previous migrations may have left single-quoted rules (@request.auth.id != '')
// which PocketBase's SQL compiler rejects at query time with a 400 error.
// Field-based rules never need string literals and are always safe.

migrate((app) => {
  try {
    const notifications = app.findCollectionByNameOrId("notifications");
    notifications.listRule   = "userId = @request.auth.id";
    notifications.viewRule   = "userId = @request.auth.id";
    notifications.updateRule = "userId = @request.auth.id";
    notifications.deleteRule = "userId = @request.auth.id";
    app.save(notifications);
    console.log("notifications: rules set to userId = @request.auth.id");
  } catch (e) {
    console.error("notifications rule fix error:", String(e));
  }
}, (app) => {});
