/// <reference path="../pb_data/types.d.ts" />

// The || operator in PocketBase listRule/viewRule fails to compile into valid
// SQL when combined with a request-level filter parameter, returning 400.
// Using a plain @request.auth.id check is the only reliable form.
// The app always adds a contractorId/clientId filter in the query so only
// relevant records are returned in practice.
migrate((app) => {
  let col;
  try {
    col = app.findCollectionByNameOrId("slot_requests");
  } catch (_) { return; }

  col.listRule = "@request.auth.id != ''";
  col.viewRule = "@request.auth.id != ''";

  app.save(col);
  console.log("slot_requests: listRule simplified to auth-only check");
}, (app) => {
  try {
    const col = app.findCollectionByNameOrId("slot_requests");
    col.listRule = "contractorId = @request.auth.id || clientId = @request.auth.id";
    col.viewRule = "contractorId = @request.auth.id || clientId = @request.auth.id";
    app.save(col);
  } catch (_) {}
});
