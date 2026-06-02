/// <reference path="../pb_data/types.d.ts" />
// Proof-of-study for the student promo, collected at registration.
//
// Kept in a SEPARATE owner-scoped collection (not on `users`) for the same
// reason as contractor_kyc: `users` is publicly listable and PocketBase returns
// every field of any listable record, so an uploaded student ID must never live
// there. Owner-only rules keep each record readable/writable by its owner (and
// superusers); the document is never exposed through the public API.
//
//   userId     — owner of the record (FK to users.id)
//   institution— chosen school, duplicated here for the reviewer's convenience
//   idDocument — photo/scan of the student ID / pažymėjimas (image or PDF)
//   status     — "pending" | "approved" | "rejected" (set by an admin in review)
//   reviewNote — optional admin note, e.g. reason for rejection
//
// An admin approving/rejecting here is mirrored onto users.studentStatus by the
// student-verification.pb.js hook. Fields are declared as plain config objects —
// the JS-VM Collection constructor only registers fields supplied this way.
migrate((app) => {
  try { app.findCollectionByNameOrId("student_verifications"); return; } catch (_) {}

  const collection = new Collection({
    "name": "student_verifications",
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
        "id": "text_sv_userId", "name": "userId", "type": "text", "system": false,
        "required": true, "hidden": false, "presentable": false, "primaryKey": false,
        "autogeneratePattern": "", "pattern": "", "min": 0, "max": 0
      },
      {
        "id": "text_sv_institution", "name": "institution", "type": "text", "system": false,
        "required": false, "hidden": false, "presentable": false, "primaryKey": false,
        "autogeneratePattern": "", "pattern": "", "min": 0, "max": 200
      },
      {
        "id": "file_sv_document", "name": "idDocument", "type": "file", "system": false,
        "required": false, "hidden": false, "presentable": false,
        "maxSelect": 1, "maxSize": 10485760,
        "mimeTypes": ["image/jpeg", "image/png", "image/webp", "application/pdf"],
        "thumbs": [], "protected": true
      },
      {
        "id": "text_sv_status", "name": "status", "type": "text", "system": false,
        "required": false, "hidden": false, "presentable": false, "primaryKey": false,
        "autogeneratePattern": "", "pattern": "", "min": 0, "max": 20
      },
      {
        "id": "text_sv_note", "name": "reviewNote", "type": "text", "system": false,
        "required": false, "hidden": false, "presentable": false, "primaryKey": false,
        "autogeneratePattern": "", "pattern": "", "min": 0, "max": 500
      },
      {
        "id": "autodate_sv_created", "name": "created", "type": "autodate", "system": false,
        "onCreate": true, "onUpdate": false, "presentable": false
      },
      {
        "id": "autodate_sv_updated", "name": "updated", "type": "autodate", "system": false,
        "onCreate": true, "onUpdate": true, "presentable": false
      }
    ]
  });

  app.save(collection);
  console.log("student_verifications collection created");
}, (app) => {
  try { const c = app.findCollectionByNameOrId("student_verifications"); app.delete(c); } catch (_) {}
});
