/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  // --- budgets ---
  try { app.findCollectionByNameOrId("budgets"); } catch (_) {
    const budgets = new Collection({
      name: "budgets",
      type: "base",
      fields: [
        { type: "select", name: "department", values: ["engineering","marketing","cs","operations","finance","hr"], maxSelect: 1, required: true },
        { type: "text",   name: "period",    required: true }, // YYYY-MM
        { type: "number", name: "allocated", required: true },
        { type: "number", name: "spent" },
        { type: "text",   name: "currency" },
        { type: "text",   name: "notes" },
      ],
      listRule: "", viewRule: "", createRule: "", updateRule: "", deleteRule: "",
    });
    app.save(budgets);
    console.log("budgets collection created");
  }

  // --- expenses ---
  try { app.findCollectionByNameOrId("expenses"); } catch (_) {
    const expenses = new Collection({
      name: "expenses",
      type: "base",
      fields: [
        { type: "select", name: "department", values: ["engineering","marketing","cs","operations","finance","hr"], maxSelect: 1, required: true },
        { type: "number", name: "amount",      required: true },
        { type: "text",   name: "currency" },
        { type: "select", name: "category",   values: ["salary","software","marketing","infrastructure","travel","office","misc"], maxSelect: 1 },
        { type: "text",   name: "description", required: true },
        { type: "text",   name: "date",        required: true }, // YYYY-MM-DD
        { type: "file",   name: "receipt",     maxSelect: 1 },
        { type: "text",   name: "submittedBy" },
        { type: "bool",   name: "approved" },
      ],
      listRule: "", viewRule: "", createRule: "", updateRule: "", deleteRule: "",
    });
    app.save(expenses);
    console.log("expenses collection created");
  }

  // --- invoices ---
  try { app.findCollectionByNameOrId("invoices"); } catch (_) {
    const invoices = new Collection({
      name: "invoices",
      type: "base",
      fields: [
        { type: "text",   name: "title",      required: true },
        { type: "text",   name: "vendor",     required: true },
        { type: "number", name: "amount",     required: true },
        { type: "text",   name: "currency" },
        { type: "text",   name: "dueDate" },   // YYYY-MM-DD
        { type: "text",   name: "paidDate" },
        { type: "select", name: "status",     values: ["pending","paid","overdue","cancelled"], maxSelect: 1 },
        { type: "file",   name: "invoiceFile", maxSelect: 1 },
        { type: "text",   name: "contractorId" },
        { type: "text",   name: "notes" },
      ],
      listRule: "", viewRule: "", createRule: "", updateRule: "", deleteRule: "",
    });
    app.save(invoices);
    console.log("invoices collection created");
  }
}, (app) => {
  for (const name of ["budgets", "expenses", "invoices"]) {
    try { const c = app.findCollectionByNameOrId(name); app.delete(c); } catch (_) {}
  }
});
