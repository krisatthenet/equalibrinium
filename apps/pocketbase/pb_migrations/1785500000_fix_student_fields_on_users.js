/// <reference path="../pb_data/types.d.ts" />
// Corrective re-add of the student gating fields onto the users collection.
//
// Why this exists: migration 1785300000 added isStudent/institution/studentStatus
// with app.save(users). On the PRODUCTION users collection that call THROWS,
// because the collection currently holds a field or rule that fails PocketBase
// 0.36.7 validation (the same reason earlier migrations' idVerified, avgResponseMs
// and responseCount are also absent in prod, while pre-upgrade fields like
// serviceRadius/trialEndsAt survive). 1785300000's broad try/catch swallowed the
// throw, so it was marked applied while the three fields were never persisted —
// confirmed live: GET /api/collections/users/records?filter=(isStudent!='')
// returns HTTP 400 "unknown field". Reproduced locally: with an invalid rule on
// users, app.save() throws and drops the field, while app.saveNoValidate() keeps it.
//
// Editing 1785300000 would not help (already recorded as applied, never re-runs),
// so this is a new migration. It re-adds the fields idempotently and, if the
// validated save fails on the still-invalid collection, logs the underlying
// validation error (useful for cleaning up the real culprit later) and falls back
// to saveNoValidate, which is not blocked by unrelated invalid fields/rules.
migrate((app) => {
  const addMissing = (c) => {
    if (!c.fields.find((f) => f.name === "isStudent"))
      c.fields.add(new BoolField({ name: "isStudent", required: false }));
    if (!c.fields.find((f) => f.name === "institution"))
      c.fields.add(new TextField({ name: "institution", required: false, max: 200 }));
    if (!c.fields.find((f) => f.name === "studentStatus"))
      c.fields.add(new TextField({ name: "studentStatus", required: false, max: 20 }));
  };

  const users = app.findCollectionByNameOrId("users");
  addMissing(users);
  try {
    app.save(users);
    console.log("users: student fields ensured (validated save)");
  } catch (e) {
    console.warn("users validated save failed: " + String(e));
    const fresh = app.findCollectionByNameOrId("users");
    addMissing(fresh);
    app.saveNoValidate(fresh);
    console.log("users: student fields ensured (saveNoValidate fallback)");
  }
}, (app) => {
  const users = app.findCollectionByNameOrId("users");
  ["isStudent", "institution", "studentStatus"].forEach((n) => {
    try { users.fields.removeByName(n); } catch (_) {}
  });
  app.saveNoValidate(users);
});
