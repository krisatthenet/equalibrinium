/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const col = app.findCollectionByNameOrId("messages");

  try { col.fields.getByName("receiverId"); } catch (_) {
    col.fields.add(new TextField({ name: "receiverId", required: false }));
  }

  try { col.fields.getByName("read"); } catch (_) {
    col.fields.add(new BoolField({ name: "read", required: false }));
  }

  col.listRule   = "senderId = @request.auth.id || receiverId = @request.auth.id";
  col.viewRule   = "senderId = @request.auth.id || receiverId = @request.auth.id";
  col.createRule = "@request.auth.id != '' && @request.body.senderId = @request.auth.id";
  col.updateRule = "receiverId = @request.auth.id";
  col.deleteRule = null;

  app.save(col);
  console.log("messages: added receiverId + read, updated rules");
}, (app) => {
  const col = app.findCollectionByNameOrId("messages");
  try { col.fields.removeByName("receiverId"); } catch (_) {}
  try { col.fields.removeByName("read"); } catch (_) {}
  col.listRule   = "@request.auth.id != ''";
  col.viewRule   = "@request.auth.id != ''";
  col.createRule = "@request.auth.id != '' && @request.body.senderId = @request.auth.id";
  col.updateRule = null;
  app.save(col);
});
