/// <reference path="../pb_data/types.d.ts" />
// Restore the user fields silently dropped while the users collection was invalid
// (see #39 / 1785600000): idVerified, avgResponseMs, responseCount — all absent
// in prod (GET /api/collections/users/records?filter=(<f>!='') returned HTTP 400).
//
// This runs right after 1785600000 re-validates the collection, and deliberately
// uses a VALIDATED app.save with NO saveNoValidate fallback: a successful save
// both restores the fields and proves the root-cause fix worked. The try/catch
// does not rethrow, so a still-invalid collection won't halt the deploy — it just
// leaves the fields absent, a clear signal (verifiable via the public records API)
// that something beyond the select values is still wrong.
migrate((app) => {
  const users = app.findCollectionByNameOrId("users");

  if (!users.fields.getByName("idVerified"))
    users.fields.add(new BoolField({ name: "idVerified", required: false }));
  if (!users.fields.getByName("avgResponseMs"))
    users.fields.add(new NumberField({ name: "avgResponseMs", required: false }));
  if (!users.fields.getByName("responseCount"))
    users.fields.add(new NumberField({ name: "responseCount", required: false }));

  try {
    app.save(users);
    console.log("fix #39: restored idVerified/avgResponseMs/responseCount (validated save)");
  } catch (e) {
    console.warn("fix #39: users still invalid; dropped fields NOT restored: " + String(e));
  }
}, (app) => {
  const users = app.findCollectionByNameOrId("users");
  ["idVerified", "avgResponseMs", "responseCount"].forEach((n) => {
    try { users.fields.removeByName(n); } catch (_) {}
  });
  app.saveNoValidate(users);
});
