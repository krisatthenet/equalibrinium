/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  try { app.findCollectionByNameOrId("admin_tasks"); return; } catch (_) {}

  const col = new Collection({
    name: "admin_tasks",
    type: "base",
    fields: [
      { type: "text",   name: "title",       required: true },
      { type: "text",   name: "description" },
      { type: "select", name: "status",      values: ["backlog","todo","inprogress","review","done"], maxSelect: 1 },
      { type: "select", name: "priority",    values: ["low","normal","high","urgent"],                maxSelect: 1 },
      { type: "select", name: "department",  values: ["engineering","marketing","cs","operations","finance","hr"], maxSelect: 1 },
      { type: "text",   name: "assigneeEmail" },
      { type: "text",   name: "dueDate" },   // YYYY-MM-DD
      { type: "text",   name: "tags" },
    ],
    listRule: "", viewRule: "", createRule: "", updateRule: "", deleteRule: "",
  });

  app.save(col);
  console.log("admin_tasks collection created");
}, (app) => {
  try { const c = app.findCollectionByNameOrId("admin_tasks"); app.delete(c); } catch (_) {}
});
