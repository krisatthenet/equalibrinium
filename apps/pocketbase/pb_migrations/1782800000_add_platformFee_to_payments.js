/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  try {
    const payments = app.findCollectionByNameOrId("payments");

    const hasField = payments.fields.getByName("platformFee");
    if (hasField) {
      console.log("platformFee field already exists on payments, skipping");
      return;
    }

    payments.fields.add({ type: "number", name: "platformFee", required: false });
    app.save(payments);
    console.log("platformFee field added to payments collection");
  } catch (e) {
    console.error("add_platformFee_to_payments failed: " + String(e));
  }
}, (app) => {
  try {
    const payments = app.findCollectionByNameOrId("payments");
    payments.fields.removeByName("platformFee");
    app.save(payments);
  } catch (_) {}
});
