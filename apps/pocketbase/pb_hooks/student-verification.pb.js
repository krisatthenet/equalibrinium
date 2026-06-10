/// <reference path="../pb_data/types.d.ts" />
// Mirror a student_verifications record's review state onto the public user.
//
// When a student uploads proof of study (create) or an admin approves/rejects it
// (update), reflect the outcome on the users record so the rest of the app can
// gate the "students go free" perk and show a verified badge without reading the
// owner-scoped student_verifications collection:
//   users.isStudent     -> true
//   users.studentStatus -> "pending" | "approved" | "rejected"
//   users.institution   -> filled in from the verification if not already set
function syncStudentStatus(e) {
  const rec = e.record;
  try {
    const userId = rec.getString("userId");
    if (userId) {
      const user = $app.findRecordById("users", userId);
      const status = rec.getString("status") || "pending";

      user.set("isStudent", true);
      user.set("studentStatus", status);

      const institution = rec.getString("institution");
      if (institution && !user.getString("institution")) {
        user.set("institution", institution);
      }

      $app.saveNoValidate(user);
    }
  } catch (err) {
    $app.logger().error("student-verification: sync failed", "error", String(err));
  }
  e.next();
}

onRecordAfterCreateSuccess(syncStudentStatus, "student_verifications");
onRecordAfterUpdateSuccess(syncStudentStatus, "student_verifications");

// --- Anti-tampering guard ---------------------------------------------------
// users.studentStatus gates the free Premium perk (see plans.js isVerifiedStudent),
// so it must only ever be set by the mirror above (an internal saveNoValidate) or
// by an admin in the PocketBase UI — never by a user's own API calls. The *Request
// hooks below fire for API requests ONLY, not for internal saves, so they don't
// interfere with the legitimate mirror. A user may still self-declare isStudent /
// institution at signup; that alone grants nothing without an approved status.
onRecordCreateRequest((e) => {
  try {
    if (!e.hasSuperuserAuth()) {
      e.record.set("studentStatus", ""); // can't self-approve at registration
    }
  } catch (err) {
    $app.logger().error("student-guard: create guard failed", "error", String(err));
  }
  e.next();
}, "users");

onRecordUpdateRequest((e) => {
  try {
    if (!e.hasSuperuserAuth()) {
      const original = $app.findRecordById("users", e.record.id);
      e.record.set("studentStatus", original.getString("studentStatus"));
    }
  } catch (err) {
    $app.logger().error("student-guard: update guard failed", "error", String(err));
  }
  e.next();
}, "users");

// --- student_verifications integrity guard ----------------------------------
// The mirror above copies student_verifications.status straight onto
// users.studentStatus, which gates the free Premium perk. The collection rules
// let any authenticated user create their own verification and update it, so
// WITHOUT this guard a user could simply create/update a record with
// status:"approved" and self-grant the perk — never reaching an admin. Approval
// must come only from a superuser (PocketBase UI), so for non-superuser API
// requests we force the status to "pending" and pin ownership to the caller.
onRecordCreateRequest((e) => {
  try {
    if (!e.hasSuperuserAuth()) {
      e.record.set("status", "pending");      // can't self-approve at upload
      e.record.set("userId", e.auth ? e.auth.id : ""); // can't file for others
    }
  } catch (err) {
    $app.logger().error("student-verif-guard: create guard failed", "error", String(err));
  }
  e.next();
}, "student_verifications");

onRecordUpdateRequest((e) => {
  try {
    if (!e.hasSuperuserAuth()) {
      const original = $app.findRecordById("student_verifications", e.record.id);
      e.record.set("status", original.getString("status")); // only admins re-review
    }
  } catch (err) {
    $app.logger().error("student-verif-guard: update guard failed", "error", String(err));
  }
  e.next();
}, "student_verifications");
