/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("referrals");
  // Allow authenticated users to list only their own referrals
  collection.listRule = '@request.auth.id != "" && referrerId = @request.auth.id';
  collection.viewRule = '@request.auth.id != "" && referrerId = @request.auth.id';
  app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("referrals");
  collection.listRule = null;
  collection.viewRule = null;
  app.save(collection);
});
