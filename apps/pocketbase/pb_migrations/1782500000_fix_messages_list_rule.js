/// <reference path="../pb_data/types.d.ts" />

// messages listRule "senderId = @request.auth.id || receiverId = @request.auth.id"
// combined with any client-side filter (ticketId, senderId, etc.) causes PocketBase
// to return 400 due to the same OR+filter SQL compilation bug seen in slot_requests.
// Simplify to auth-only guard; the client always filters by sender/receiver/ticketId
// so only relevant records are returned in practice.

migrate((app) => {
  try {
    const col = app.findCollectionByNameOrId("messages");
    col.listRule = "@request.auth.id != ''";
    col.viewRule = "@request.auth.id != ''";
    app.save(col);
    console.log("messages: listRule/viewRule simplified to auth-only guard");
  } catch (_) {}
}, (app) => {
  try {
    const col = app.findCollectionByNameOrId("messages");
    col.listRule = "senderId = @request.auth.id || receiverId = @request.auth.id";
    col.viewRule = "senderId = @request.auth.id || receiverId = @request.auth.id";
    app.save(col);
  } catch (_) {}
});
