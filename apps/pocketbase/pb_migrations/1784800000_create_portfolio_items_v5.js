/// <reference path="../pb_data/types.d.ts" />
// Creates portfolio_items on a fresh database.
//
// Why this was rewritten: the earlier v4/v5 bodies passed `new TextField(...)`
// instances into the `new Collection({ fields: [...] })` constructor. The JS-VM
// does NOT register fields supplied that way before the collection's rules are
// validated, so updateRule/deleteRule (which reference `contractorId`) failed
// with `unknown field "contractorId"`. v4 swallowed the error (creating nothing);
// v5 then threw and halted the whole migration chain on any DB without an
// existing portfolio_items collection (fresh staging/CI).
//
// Fix: declare fields as plain config objects (the pattern that works — see
// contractor_kyc / student_verifications), which ARE registered before rule
// validation. Production already has portfolio_items, so this migration is
// recorded as applied there and never re-runs; editing the body is safe because
// PocketBase tracks migrations by filename, not content hash.
//
// File fields (beforePhotos/afterPhotos) are intentionally left to the following
// add_photo_fields migration, which adds them via col.fields.add(new FileField())
// on an existing collection — a pattern that works fine. Rules match the prod
// final state: public read, owner-scoped writes (createRule tightened here to the
// value fix_portfolio_items_create_rule would otherwise set).
migrate((app) => {
  try { app.findCollectionByNameOrId("portfolio_items"); return; } catch (_) {}

  const col = new Collection({
    "name": "portfolio_items",
    "type": "base",
    "listRule": "",
    "viewRule": "",
    "createRule": "contractorId = @request.auth.id",
    "updateRule": "contractorId = @request.auth.id",
    "deleteRule": "contractorId = @request.auth.id",
    "fields": [
      {
        "id": "text0000000001", "name": "id", "type": "text", "system": true,
        "primaryKey": true, "required": true, "hidden": false, "presentable": false,
        "autogeneratePattern": "[a-z0-9]{15}", "pattern": "^[a-z0-9]+$", "min": 15, "max": 15
      },
      {
        "id": "text_pi_contractor", "name": "contractorId", "type": "text", "system": false,
        "required": true, "hidden": false, "presentable": false, "primaryKey": false,
        "autogeneratePattern": "", "pattern": "", "min": 0, "max": 0
      },
      {
        "id": "text_pi_title", "name": "title", "type": "text", "system": false,
        "required": true, "hidden": false, "presentable": false, "primaryKey": false,
        "autogeneratePattern": "", "pattern": "", "min": 0, "max": 0
      },
      {
        "id": "text_pi_description", "name": "description", "type": "text", "system": false,
        "required": false, "hidden": false, "presentable": false, "primaryKey": false,
        "autogeneratePattern": "", "pattern": "", "min": 0, "max": 0
      }
    ]
  });

  app.save(col);
  console.log("portfolio_items created (v5, config-object fields)");
}, (app) => {
  try { const c = app.findCollectionByNameOrId("portfolio_items"); app.delete(c); } catch (_) {}
});
