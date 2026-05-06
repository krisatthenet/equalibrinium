/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const users = app.findCollectionByNameOrId("users");
  // Allow viewing any contractor profile publicly; other profiles require auth
  users.viewRule = "userType = 'contractor' || @request.auth.id != ''";
  app.save(users);
}, (app) => {
  const users = app.findCollectionByNameOrId("users");
  users.viewRule = "@request.auth.id != ''";
  app.save(users);
})
