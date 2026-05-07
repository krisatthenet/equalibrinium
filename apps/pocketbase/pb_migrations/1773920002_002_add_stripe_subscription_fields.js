/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("users");

  const fields = [
    { name: "stripeCustomerId",     ctor: TextField, opts: { required: false, max: 100 } },
    { name: "stripeSubscriptionId", ctor: TextField, opts: { required: false, max: 100 } },
  ];

  for (const { name, ctor, opts } of fields) {
    if (collection.fields.getByName(name)) continue;
    collection.fields.add(new ctor({ name, ...opts }));
  }

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("users");
  for (const name of ["stripeCustomerId", "stripeSubscriptionId"]) {
    collection.fields.removeByName(name);
  }
  return app.save(collection);
})
