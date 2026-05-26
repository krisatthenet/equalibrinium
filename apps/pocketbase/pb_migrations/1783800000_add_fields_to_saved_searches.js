/// <reference path="../pb_data/types.d.ts" />

// The saved_searches collection was created but fields weren't persisted via the constructor.
// Add them explicitly here.
migrate((app) => {
  try {
    const col = app.findCollectionByNameOrId("saved_searches");

    const fieldNames = col.fields.getAll().map(f => f.name);

    if (!fieldNames.includes("userId")) {
      col.fields.add(new TextField({ name: "userId", required: true }));
    }
    if (!fieldNames.includes("label")) {
      col.fields.add(new TextField({ name: "label", required: true }));
    }
    if (!fieldNames.includes("categoryId")) {
      col.fields.add(new TextField({ name: "categoryId", required: false }));
    }
    if (!fieldNames.includes("location")) {
      col.fields.add(new TextField({ name: "location", required: false }));
    }
    if (!fieldNames.includes("keyword")) {
      col.fields.add(new TextField({ name: "keyword", required: false }));
    }

    app.save(col);
    console.log("saved_searches: fields added");
  } catch (e) {
    console.error("add_fields_to_saved_searches failed:", String(e));
  }
}, (app) => {});
