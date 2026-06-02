/// <reference path="../pb_data/types.d.ts" />
// Student promo: non-sensitive flags on the public `users` collection.
//   isStudent     — self-declared at registration via /register?promo=student
//   institution   — chosen Lithuanian university/college/school (see ltInstitutions.js)
//   studentStatus — verification state, mirrored from student_verifications by the
//                   student-verification hook: "pending" | "approved" | "rejected"
// These are safe to expose on the publicly listable users record (no PII). The
// uploaded proof of study lives in the owner-scoped `student_verifications`
// collection instead — see the next migration.
migrate((app) => {
  try {
    const users = app.findCollectionByNameOrId("users");

    try { users.fields.getByName("isStudent"); } catch (_) {
      users.fields.add(new BoolField({ name: "isStudent", required: false }));
    }

    try { users.fields.getByName("institution"); } catch (_) {
      users.fields.add(new TextField({ name: "institution", required: false, max: 200 }));
    }

    try { users.fields.getByName("studentStatus"); } catch (_) {
      users.fields.add(new TextField({ name: "studentStatus", required: false, max: 20 }));
    }

    app.save(users);
    console.log("users: added isStudent + institution + studentStatus");
  } catch (e) {
    console.error("add_student_fields_to_users failed:", String(e));
  }
}, (app) => {
  try {
    const users = app.findCollectionByNameOrId("users");
    try { users.fields.removeByName("isStudent"); } catch (_) {}
    try { users.fields.removeByName("institution"); } catch (_) {}
    try { users.fields.removeByName("studentStatus"); } catch (_) {}
    app.save(users);
  } catch (_) {}
});
