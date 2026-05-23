/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("users");

  const field = new Field({
    type: "date",
    name: "trialEndsAt",
    required: false,
  });

  collection.fields.add(field);
  app.save(collection);

  // Backfill: give all existing users a 1-week trial from today
  const trialEnd = new Date();
  trialEnd.setDate(trialEnd.getDate() + 7);
  const trialEndStr = trialEnd.toISOString().replace('T', ' ').replace(/\.\d{3}Z$/, '.000Z');

  const users = app.findAllRecords("users");
  for (const user of users) {
    if (!user.get("trialEndsAt")) {
      user.set("trialEndsAt", trialEndStr);
      app.save(user);
    }
  }
}, (app) => {
  const collection = app.findCollectionByNameOrId("users");
  collection.fields.removeByName("trialEndsAt");
  app.save(collection);
});
