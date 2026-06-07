/// <reference path="../pb_data/types.d.ts" />
//
// Stop the public `users` listing from leaking sensitive data.
//
// Context: the users collection is intentionally public for contractor search
// (listRule `userType != 'client' || id = @request.auth.id`, see
// 1779800000_fix_users_list_rule). PocketBase returns EVERY non-hidden field to
// any anonymous caller, so a single unauthenticated
//   GET /api/collections/users/records
// currently exposes phone numbers, exact GPS, Stripe IDs, balance, ban info, etc.
//
// Marking a field `hidden` makes PB omit it from ALL API responses except for
// superusers. That fully fixes the leak for server-only fields, but it ALSO hides
// the field from the record's own owner and from other authenticated consumers
// (hidden has no per-owner exception). So we only hide fields here that NO client
// legitimately reads — i.e. fields used solely by the API server / Stripe and by
// admin tooling (admin authenticates as `_superusers`, which still sees them).
//
// Fields that owners or non-superuser features read (phone, latitude, longitude,
// balance, referralCode, referredByCode, role) are deliberately NOT hidden here —
// see RISKY list below. Hiding those requires first moving their reads behind a
// superuser-backed API route, otherwise it breaks:
//   - phone            booking-flow contact reveal (AuctionTicketDetailsPage) + owner Settings prefill
//   - latitude/longitude  bidder distance calc (BidComparisonView.jsx:33-34) + owner Settings
//   - balance          owner ContractorDashboard / Settings balance display
//   - referralCode     owner referral code display (Dashboard/Settings)
//   - referredByCode   set at registration; read for attribution
//   - role             client-side role checks
//
// JSVM gotcha (see memory pb-users-savenovalidate-gotcha): collection.fields
// .getByName() returns a COPY — mutating it alone never persists. We mutate the
// copy's `hidden` flag and re-add() it; FieldsList.add REPLACES by id/name, and
// because we pass the full existing field object the column/type/options are kept.

// Server-only fields with NO client reader — safe to hide with zero feature breakage.
const HIDE = [
  "stripeAccountId",
  "stripeCustomerId",
  "stripeSubscriptionId",
  "stripeOnboarded",
  "primerSubscriptionId",
  "ban_reason",
  "ban_date",
  "banned",
  // phone is now served to matched parties only, via the authenticated,
  // match-gated GET /contacts/users/:id route (apps/api/src/routes/contacts.js).
  // The booking flow (AuctionTicketDetailsPage) reads it from there; owner
  // Settings edits it via its own authed write (hidden blocks reads, not writes).
  "phone",
];

// RISKY — uncomment to add here ONLY after their reads move behind a secured
// (superuser) API route, or they will break the features listed in the header:
//   - latitude/longitude  bidder distance calc (BidComparisonView.jsx:33-34) reads
//                         these client-side; move that ranking server-side first.
//                         (The contact route already returns lat/long for matched
//                         parties, so the map/contact use case is covered.)
//   - balance             owner ContractorDashboard:120 / SettingsPage:76 display
//   - referralCode        owner Dashboard:688 / Settings:1136 display
//   - referredByCode      set at registration; read for attribution
//   - role                client-side role checks
// const HIDE = HIDE.concat([
//   "latitude", "longitude", "balance", "referralCode", "referredByCode", "role",
// ]);

migrate((app) => {
  const setHidden = (c, value) => {
    HIDE.forEach((name) => {
      const f = c.fields.getByName(name); // returns a copy
      if (!f) {
        console.warn("hide_sensitive_user_fields: field not found, skipped: " + name);
        return;
      }
      f.hidden = value;
      c.fields.add(f); // replaces the original by id/name, preserving type/options
    });
  };

  const users = app.findCollectionByNameOrId("users");
  setHidden(users, true);

  try {
    app.save(users); // validated save: success also proves the collection is valid
    console.log("users: sensitive fields hidden (validated save): " + HIDE.join(", "));
  } catch (e) {
    // The users collection has historically failed whole-collection validation on
    // unrelated invalid state (#39). Don't let that block the security fix.
    console.warn("users validated save failed, retrying saveNoValidate: " + String(e));
    const fresh = app.findCollectionByNameOrId("users");
    HIDE.forEach((name) => {
      const f = fresh.fields.getByName(name);
      if (f) { f.hidden = true; fresh.fields.add(f); }
    });
    app.saveNoValidate(fresh);
    console.log("users: sensitive fields hidden (saveNoValidate fallback): " + HIDE.join(", "));
  }
}, (app) => {
  const users = app.findCollectionByNameOrId("users");
  HIDE.forEach((name) => {
    const f = users.fields.getByName(name);
    if (f) { f.hidden = false; users.fields.add(f); }
  });
  try {
    app.save(users);
  } catch (_) {
    app.saveNoValidate(users);
  }
});
