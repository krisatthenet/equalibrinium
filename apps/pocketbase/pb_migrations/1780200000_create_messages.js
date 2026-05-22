/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  try {
    app.findCollectionByNameOrId("messages");
    console.log("messages collection already exists");
    return;
  } catch (_) {}

  const collection = new Collection({
    name: "messages",
    type: "base",
    fields: [
      new TextField({ name: "ticketId",    required: true }),
      new TextField({ name: "senderId",    required: true }),
      new TextField({ name: "senderName"                 }),
      new TextField({ name: "text",        required: true }),
    ],
    listRule:   "@request.auth.id != ''",
    viewRule:   "@request.auth.id != ''",
    createRule: "@request.auth.id != '' && @request.data.senderId = @request.auth.id",
    updateRule: null,
    deleteRule: null,
    indexes: ["CREATE INDEX idx_messages_ticket ON messages (ticketId)"],
  });

  app.save(collection);
  console.log("messages collection created");
}, (app) => {
  try {
    const col = app.findCollectionByNameOrId("messages");
    app.delete(col);
  } catch (_) {}
});
