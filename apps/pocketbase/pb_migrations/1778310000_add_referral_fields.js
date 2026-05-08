/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  // --- Add referral fields to users ---
  const users = app.findCollectionByNameOrId("users");

  const userFields = [
    { name: "referralCode",      ctor: TextField,  opts: { required: false, max: 12 } },
    { name: "referredByCode",    ctor: TextField,  opts: { required: false, max: 12 } },
    { name: "referralFreeMonths", ctor: NumberField, opts: { required: false } },
  ];

  for (const { name, ctor, opts } of userFields) {
    if (users.fields.getByName(name)) continue;
    users.fields.add(new ctor({ name, ...opts }));
  }
  app.save(users);

  // --- Create referrals collection ---
  try {
    app.findCollectionByNameOrId("referrals");
  } catch (_) {
    const referrals = new Collection({
      name: "referrals",
      type: "base",
      fields: [
        new TextField({ name: "referrerId", required: true }),
        new TextField({ name: "referredId", required: true }),
        new DateField({ name: "rewardedAt" }),
      ],
      listRule: null,
      viewRule: null,
      createRule: null,
      updateRule: null,
      deleteRule: null,
    });
    app.save(referrals);
  }
}, (app) => {
  const users = app.findCollectionByNameOrId("users");
  for (const name of ["referralCode", "referredByCode", "referralFreeMonths"]) {
    try { users.fields.removeByName(name); } catch (_) {}
  }
  app.save(users);

  try {
    const referrals = app.findCollectionByNameOrId("referrals");
    app.delete(referrals);
  } catch (_) {}
});
