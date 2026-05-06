/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId('bids');
  // Allow any authenticated user to update bids so clients can accept/reject
  collection.updateRule = "@request.auth.id != ''";
  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId('bids');
  collection.updateRule = "@request.auth.id != '' && masterId = @request.auth.id";
  return app.save(collection);
});
