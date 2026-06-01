/// <reference path="../pb_data/types.d.ts" />
// Sensitive contractor compliance/payout data, collected at registration.
// Kept in a SEPARATE owner-scoped collection (not on `users`) because `users`
// is publicly listable for the explore page, and PocketBase returns every field
// of any listable record — so personalCode/iban must never live there.
//   personalCode — asmens kodas (Lithuanian personal ID)
//   businessCode — individuali veikla reg. number or company code (UAB/MB)
//   iban         — bank account for payouts
// A TIN field for DAC7 reporting is deferred — see docs/COMPLIANCE_DAC7_KYC.md.
//
// Fields are declared as plain config objects (not new XxxField() instances) —
// the JS-VM Collection constructor only registers fields supplied this way.
// Owner-only rules keep each record readable/writable by its owner (and
// superusers); the PII is never exposed through the public API.
migrate((app) => {
  try { app.findCollectionByNameOrId("contractor_kyc"); return; } catch (_) {}

  const collection = new Collection({
    "name": "contractor_kyc",
    "type": "base",
    "listRule": "userId = @request.auth.id",
    "viewRule": "userId = @request.auth.id",
    "createRule": "@request.auth.id != ''",
    "updateRule": "userId = @request.auth.id",
    "deleteRule": "userId = @request.auth.id",
    "fields": [
      {
        "id": "text0000000001", "name": "id", "type": "text", "system": true,
        "primaryKey": true, "required": true, "hidden": false, "presentable": false,
        "autogeneratePattern": "[a-z0-9]{15}", "pattern": "^[a-z0-9]+$", "min": 15, "max": 15
      },
      {
        "id": "text_kyc_userId", "name": "userId", "type": "text", "system": false,
        "required": true, "hidden": false, "presentable": false, "primaryKey": false,
        "autogeneratePattern": "", "pattern": "", "min": 0, "max": 0
      },
      {
        "id": "text_kyc_personal", "name": "personalCode", "type": "text", "system": false,
        "required": false, "hidden": false, "presentable": false, "primaryKey": false,
        "autogeneratePattern": "", "pattern": "", "min": 0, "max": 11
      },
      {
        "id": "text_kyc_business", "name": "businessCode", "type": "text", "system": false,
        "required": false, "hidden": false, "presentable": false, "primaryKey": false,
        "autogeneratePattern": "", "pattern": "", "min": 0, "max": 20
      },
      {
        "id": "text_kyc_iban", "name": "iban", "type": "text", "system": false,
        "required": false, "hidden": false, "presentable": false, "primaryKey": false,
        "autogeneratePattern": "", "pattern": "", "min": 0, "max": 34
      }
    ]
  });

  app.save(collection);
  console.log("contractor_kyc collection created");
}, (app) => {
  try { const c = app.findCollectionByNameOrId("contractor_kyc"); app.delete(c); } catch (_) {}
});
