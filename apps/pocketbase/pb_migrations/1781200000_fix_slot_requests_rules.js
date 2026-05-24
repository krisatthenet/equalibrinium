/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  let col;
  try {
    col = app.findCollectionByNameOrId("slot_requests");
  } catch (_) {
    return; // collection doesn't exist yet, nothing to fix
  }

  // PocketBase's SQL compiler can fail to combine an OR rule with a
  // request-level filter. Use separate conditions without the top-level &&
  // — unauthenticated requests have @request.auth.id = "" which will never
  // match a real contractorId or clientId, so this is still secure.
  col.listRule   = "contractorId = @request.auth.id || clientId = @request.auth.id";
  col.viewRule   = "contractorId = @request.auth.id || clientId = @request.auth.id";

  app.save(col);
  console.log("slot_requests rules updated");
}, (app) => {
  try {
    const col = app.findCollectionByNameOrId("slot_requests");
    col.listRule   = "@request.auth.id != '' && (contractorId = @request.auth.id || clientId = @request.auth.id)";
    col.viewRule   = "@request.auth.id != '' && (contractorId = @request.auth.id || clientId = @request.auth.id)";
    app.save(col);
  } catch (_) {}
});
