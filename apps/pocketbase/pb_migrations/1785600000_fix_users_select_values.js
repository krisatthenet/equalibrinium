/// <reference path="../pb_data/types.d.ts" />
// Root-cause fix for #39.
//
// A select field on the users collection (userType and/or role) had its `values`
// array emptied on production. Under PocketBase 0.36.7 an empty select is invalid
// ("fields: (N: (values: cannot be blank.))"), so app.save(users) THROWS — which
// silently broke every later field-add migration that used app.save (isStudent/
// institution/studentStatus, idVerified, avgResponseMs, responseCount). Verified
// locally: clearing a select's values makes app.save throw; re-asserting them
// fixes it. (There is already an ensure_usertype_values bootstrap hook precisely
// because userType values get cleared; role had no equivalent guard.)
//
// Re-assert the canonical values for both select fields. A validated save is
// attempted first — success means the collection validates again, i.e. the root
// cause is resolved — and if some other invalid bit remains, fall back to
// saveNoValidate so the value fix still persists, and log the residual error.
migrate((app) => {
  const users = app.findCollectionByNameOrId("users");

  // Update in place by REPLACING the field with a fresh SelectField that carries
  // the SAME id (FieldsList.add matches by id and replaces, keeping the column +
  // its record data). Two JSVM gotchas this avoids: (1) the field returned by
  // getByName() is a copy, so mutating its `.values` alone never propagates;
  // (2) `field.type` is a method, not a string, so a `=== "select"` guard is
  // always false. We target userType/role by name (both single-select), so we
  // rebuild them explicitly with their canonical options.
  const ensureValues = (name, values) => {
    const f = users.fields.getByName(name);
    if (!f) return;
    users.fields.add(new SelectField({
      id: f.id,
      name: name,
      required: false,
      maxSelect: 1,
      values: values,
    }));
  };
  ensureValues("userType", ["client", "contractor", "master", "influencer"]);
  ensureValues("role", ["user", "admin"]);

  try {
    app.save(users);
    console.log("fix #39: users select values re-asserted; collection validates");
  } catch (e) {
    console.warn("fix #39: users still invalid after select-values fix: " + String(e));
    app.saveNoValidate(users);
  }
}, (app) => {
  // no-op: re-asserting canonical select values is not meaningfully reversible.
});
