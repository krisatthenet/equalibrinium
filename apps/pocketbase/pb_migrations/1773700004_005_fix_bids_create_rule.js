/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const bids = app.findCollectionByNameOrId("bids");
  bids.createRule = "@request.auth.id != '' && @request.auth.userType = 'contractor'";
  app.save(bids);
}, (app) => {
  const bids = app.findCollectionByNameOrId("bids");
  bids.createRule = "@request.auth.id != '' && @request.auth.userType = 'master'";
  app.save(bids);
})
