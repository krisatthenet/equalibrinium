/// <reference path="../pb_data/types.d.ts" />

// The messages collection was created before 1780200000_create_messages.js,
// so that migration's early-return guard skipped adding ticketId/text/senderName.
// Add them now if missing (same guard pattern as 1781950000).
migrate((app) => {
  const col = app.findCollectionByNameOrId("messages");

  if (!col.fields.getByName("ticketId")) {
    col.fields.add(new TextField({ name: "ticketId", required: true }));
  }
  if (!col.fields.getByName("senderName")) {
    col.fields.add(new TextField({ name: "senderName", required: false }));
  }
  if (!col.fields.getByName("text")) {
    col.fields.add(new TextField({ name: "text", required: true }));
  }

  app.save(col);
  console.log("messages: ticketId/senderName/text fields ensured");
}, (app) => {
  // These fields hold chat data — rolling back would destroy messages.
});
