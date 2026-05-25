/// <reference path="../pb_data/types.d.ts" />

// Previous migrations (1782400000, 1782500000) set rules using single-quoted empty strings
// e.g. @request.auth.id != ''
// PocketBase's filter parser only accepts double-quoted string literals.
// Single-quoted rules are stored without error but fail at query compile time → 400.
// This migration re-applies all three affected collections with correct double-quoted syntax.

migrate((app) => {
  try {
    const notifications = app.findCollectionByNameOrId("notifications");
    // Use field-based rule (no quoted string needed) — simpler and always valid
    notifications.listRule   = "userId = @request.auth.id";
    notifications.viewRule   = "userId = @request.auth.id";
    notifications.updateRule = "userId = @request.auth.id";
    notifications.deleteRule = "userId = @request.auth.id";
    app.save(notifications);
    console.log("notifications: rule restored to userId = @request.auth.id");
  } catch (e) {
    console.error("notifications fix error:", String(e));
  }

  try {
    const slotRequests = app.findCollectionByNameOrId("slot_requests");
    slotRequests.listRule = '@request.auth.id != ""';
    slotRequests.viewRule = '@request.auth.id != ""';
    app.save(slotRequests);
    console.log("slot_requests: rule fixed to @request.auth.id != \"\"");
  } catch (e) {
    console.error("slot_requests fix error:", String(e));
  }

  try {
    const messages = app.findCollectionByNameOrId("messages");
    messages.listRule = '@request.auth.id != ""';
    messages.viewRule = '@request.auth.id != ""';
    app.save(messages);
    console.log("messages: rule fixed to @request.auth.id != \"\"");
  } catch (e) {
    console.error("messages fix error:", String(e));
  }
}, (app) => {
  try {
    const notifications = app.findCollectionByNameOrId("notifications");
    notifications.listRule   = "@request.auth.id != ''";
    notifications.viewRule   = "@request.auth.id != ''";
    notifications.updateRule = "@request.auth.id != ''";
    notifications.deleteRule = "@request.auth.id != ''";
    app.save(notifications);
  } catch (_) {}

  try {
    const slotRequests = app.findCollectionByNameOrId("slot_requests");
    slotRequests.listRule = "@request.auth.id != ''";
    slotRequests.viewRule = "@request.auth.id != ''";
    app.save(slotRequests);
  } catch (_) {}

  try {
    const messages = app.findCollectionByNameOrId("messages");
    messages.listRule = "@request.auth.id != ''";
    messages.viewRule = "@request.auth.id != ''";
    app.save(messages);
  } catch (_) {}
});
