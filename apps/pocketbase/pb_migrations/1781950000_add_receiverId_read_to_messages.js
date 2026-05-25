/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const col = app.findCollectionByNameOrId("messages");

  try { col.fields.getByName("senderId"); } catch (_) {
    col.fields.add(new TextField({ name: "senderId", required: true }));
  }

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
/// <reference path=\"../pb_data/types.d.ts\" />\r\n\r\nmigrate((app) => {\r\n  const col = app.findCollectionByNameOrId(\"messages\");\r\n\r\n  // Ensure senderId field exists\r\n  try {\r\n    col.fields.getByName(\"senderId\");\r\n  } catch (_) {\r\n    col.fields.add(new TextField({ name: \"senderId\", required: true }));\r\n  }\r\n\r\n  // Ensure receiverId field exists\r\n  try {\r\n    col.fields.getByName(\"receiverId\");\r\n  } catch (_) {\r\n    col.fields.add(new TextField({ name: \"receiverId\", required: false }));\r\n  }\r\n\r\n  // Ensure read field exists\r\n  try {\r\n    col.fields.getByName(\"read\");\r\n  } catch (_) {\r\n    col.fields.add(new BoolField({ name: \"read\", required: false }));\r\n  }\r\n\r\n  // Save the collection with new fields before applying rules\r\n  app.save(col);\r\n\r\n  // Now apply the rules\r\n  col.listRule   = \"senderId = @request.auth.id || receiverId = @request.auth.id\";\r\n  col.viewRule   = \"senderId = @request.auth.id || receiverId = @request.auth.id\";\r\n  col.createRule = \"@request.auth.id != '' && @request.body.senderId = @request.auth.id\";\r\n  col.updateRule = \"receiverId = @request.auth.id\";\r\n  col.deleteRule = null;\r\n\r\n  app.save(col);\r\n  console.log(\"messages: added receiverId + read, updated rules\");\r\n}, (app) => {\r\n  const col = app.findCollectionByNameOrId(\"messages\");\r\n  try { col.fields.removeByName(\"receiverId\"); } catch (_) {}\r\n  try { col.fields.removeByName(\"read\"); } catch (_) {}\r\n  col.listRule   = \"@request.auth.id != ''\";\r\n  col.viewRule   = \"@request.auth.id != ''\";\r\n  col.createRule = \"@request.auth.id != '' && @request.body.senderId = @request.auth.id\";\r\n  col.updateRule = null;\r\n  app.save(col);\r\n});\r\n
