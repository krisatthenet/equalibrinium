/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("bids");
  collection.createRule = "@request.auth.id != '' && @request.auth.userType = 'contractor'";
  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("bids");
  collection.createRule = "@request.auth.id != '' && @request.auth.userType = 'master'";
  return app.save(collection);
})
