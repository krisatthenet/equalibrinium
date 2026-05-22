/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  try {
    const collection = app.findCollectionByNameOrId("users");
    if (collection.fields.getByName("stripeCustomerId")) return;
    collection.fields.add(new TextField({ name: "stripeCustomerId" }));
    app.save(collection);
    console.log("Added stripeCustomerId to users");
  } catch (e) {
    console.log("add_stripe_customer_id skipped: " + e.message);
  }
}, (app) => {
  try {
    const collection = app.findCollectionByNameOrId("users");
    collection.fields.removeByName("stripeCustomerId");
    app.save(collection);
  } catch (e) {}
});
