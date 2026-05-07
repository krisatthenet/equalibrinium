/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection({
    name: "contacts",
    type: "base",
    listRule: null,
    viewRule: null,
    createRule: "",
    updateRule: null,
    deleteRule: null,
    fields: [
      { name: "name",     type: "text",  required: true },
      { name: "email",    type: "email", required: true },
      { name: "subject",  type: "text",  required: true },
      { name: "category", type: "text",  required: false },
      { name: "message",  type: "text",  required: true },
    ]
  });
  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("contacts");
  return app.delete(collection);
});
