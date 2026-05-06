/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  // auction_tickets: public listing so anyone can browse open requests
  const tickets = app.findCollectionByNameOrId("auction_tickets");
  tickets.listRule = "";
  tickets.viewRule = "";
  app.save(tickets);

  // users: contractors visible publicly, other users only when authenticated
  const users = app.findCollectionByNameOrId("users");
  users.listRule = "userType = 'contractor' || @request.auth.id != ''";
  app.save(users);
}, (app) => {
  const tickets = app.findCollectionByNameOrId("auction_tickets");
  tickets.listRule = "@request.auth.id != ''";
  tickets.viewRule = "@request.auth.id != ''";
  app.save(tickets);

  const users = app.findCollectionByNameOrId("users");
  users.listRule = "@request.auth.id != ''";
  app.save(users);
})
