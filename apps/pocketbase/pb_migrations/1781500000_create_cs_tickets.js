/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  try { app.findCollectionByNameOrId("cs_tickets"); return; } catch (_) {}

  const col = new Collection({
    name: "cs_tickets",
    type: "base",
    fields: [
      { type: "text",   name: "name" },
      { type: "text",   name: "email" },
      { type: "text",   name: "phone" },
      { type: "text",   name: "subject",  required: true },
      { type: "text",   name: "message",  required: true },
      { type: "select", name: "status",   values: ["open","in_progress","resolved","closed"], maxSelect: 1 },
      { type: "select", name: "priority", values: ["low","normal","high","urgent"],           maxSelect: 1 },
      { type: "select", name: "source",   values: ["widget","email","phone","manual"],        maxSelect: 1 },
      { type: "text",   name: "assigneeEmail" },
      { type: "text",   name: "response" },
      { type: "text",   name: "internalNote" },
      { type: "text",   name: "userId" }, // if submitted by logged-in user
    ],
    // superusers bypass rules; no public access
    listRule:   "",
    viewRule:   "",
    createRule: "",
    updateRule: "",
    deleteRule: "",
  });

  app.save(col);
  console.log("cs_tickets collection created");
}, (app) => {
  try { const c = app.findCollectionByNameOrId("cs_tickets"); app.delete(c); } catch (_) {}
});
