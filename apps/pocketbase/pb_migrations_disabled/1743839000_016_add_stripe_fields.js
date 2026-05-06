/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  // --- Add stripeAccountId + stripeOnboarded to users ---
  const users = app.findCollectionByNameOrId("users");

  users.fields.add(new Field({
    "hidden": false, "id": "text_stripe_account_id", "name": "stripeAccountId",
    "type": "text", "required": false, "system": false, "presentable": false,
    "autogeneratePattern": "", "max": 0, "min": 0, "pattern": ""
  }));
  users.fields.add(new Field({
    "hidden": false, "id": "bool_stripe_onboarded", "name": "stripeOnboarded",
    "type": "bool", "required": false, "system": false, "presentable": false
  }));
  app.save(users);

  // --- Fix payments collection select values ---
  const payments = app.findCollectionByNameOrId("payments");

  // paymentMethod: add 'card' and 'paypal'
  const methodField = payments.fields.getByName("paymentMethod");
  if (methodField) {
    methodField.values = ["stripe", "card", "paypal", "google_wallet", "unknown"];
    payments.fields.add(methodField);
  }

  // paymentOption: add 'full'
  const optionField = payments.fields.getByName("paymentOption");
  if (optionField) {
    optionField.values = ["full", "advance_20", "full_discount", "unknown"];
    payments.fields.add(optionField);
  }

  app.save(payments);
}, (app) => {
  const users = app.findCollectionByNameOrId("users");
  users.fields.removeById("text_stripe_account_id");
  users.fields.removeById("bool_stripe_onboarded");
  app.save(users);
});
