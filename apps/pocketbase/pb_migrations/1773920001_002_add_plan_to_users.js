/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("users");

  const fields = [
    { name: "plan",                 ctor: TextField,  opts: { required: false, max: 20 } },
    { name: "planCycle",            ctor: TextField,  opts: { required: false, max: 10 } },
    { name: "planExpiresAt",        ctor: DateField,  opts: {} },
    { name: "primerSubscriptionId", ctor: TextField,  opts: { required: false, max: 100 } },
  ];

  for (const { name, ctor, opts } of fields) {
    if (collection.fields.getByName(name)) continue;
    collection.fields.add(new ctor({ name, ...opts }));
  }

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("users");
  for (const name of ["plan", "planCycle", "planExpiresAt", "primerSubscriptionId"]) {
    collection.fields.removeByName(name);
  }
  return app.save(collection);
})
