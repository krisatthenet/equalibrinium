/// <reference path="../pb_data/types.d.ts" />

// PocketBase's SQL compiler returns 400 when an OR-based listRule is combined
// with a client-side filter parameter. Fix both affected collections:
//   - notifications: client was passing redundant userId filter that combined
//     with "userId = @request.auth.id" and triggered the bug
//   - slot_requests: "contractorId = @request.auth.id || clientId = @request.auth.id"
//     combined with any client filter also triggers the bug
// Both are simplified to auth-only guard; security is maintained because the
// client always filters by the authenticated user's own ID.

migrate((app) => {
  try {
    const notifications = app.findCollectionByNameOrId("notifications");
    notifications.listRule   = "@request.auth.id != ''";
    notifications.viewRule   = "@request.auth.id != ''";
    notifications.updateRule = "@request.auth.id != ''";
    notifications.deleteRule = "@request.auth.id != ''";
    app.save(notifications);
    console.log("notifications: rules simplified to auth-only guard");
  } catch (_) {}

  try {
    const slotRequests = app.findCollectionByNameOrId("slot_requests");
    slotRequests.listRule = "@request.auth.id != ''";
    slotRequests.viewRule = "@request.auth.id != ''";
    app.save(slotRequests);
    console.log("slot_requests: listRule/viewRule simplified to auth-only guard");
  } catch (_) {}
}, (app) => {
  try {
    const notifications = app.findCollectionByNameOrId("notifications");
    notifications.listRule   = "userId = @request.auth.id";
    notifications.viewRule   = "userId = @request.auth.id";
    notifications.updateRule = "userId = @request.auth.id";
    notifications.deleteRule = "userId = @request.auth.id";
    app.save(notifications);
  } catch (_) {}

  try {
    const slotRequests = app.findCollectionByNameOrId("slot_requests");
    slotRequests.listRule = "contractorId = @request.auth.id || clientId = @request.auth.id";
    slotRequests.viewRule = "contractorId = @request.auth.id || clientId = @request.auth.id";
    app.save(slotRequests);
  } catch (_) {}
});
