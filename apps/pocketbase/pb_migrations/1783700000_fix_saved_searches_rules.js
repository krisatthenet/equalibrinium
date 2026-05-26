/// <reference path="../pb_data/types.d.ts" />

// saved_searches was created but listRule/viewRule/updateRule/deleteRule weren't applied.
// Fix them here, same pattern as 1782700000_fix_collection_rules.js.
migrate((app) => {
  try {
    const col = app.findCollectionByNameOrId("saved_searches");
    col.listRule   = '@request.auth.id != ""';
    col.viewRule   = '@request.auth.id != ""';
    col.createRule = '@request.auth.id != ""';
    col.updateRule = '@request.auth.id != ""';
    col.deleteRule = '@request.auth.id != ""';
    app.save(col);
    console.log("saved_searches: rules fixed");
  } catch (e) {
    console.error("fix_saved_searches_rules failed:", String(e));
  }
}, (app) => {});
