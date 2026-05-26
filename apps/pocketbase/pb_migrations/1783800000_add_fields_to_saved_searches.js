/// <reference path="../pb_data/types.d.ts" />

// The saved_searches collection was created but fields weren't persisted via the constructor.
// Add them explicitly here.
migrate((app) => {
  try {
    const col = app.findCollectionByNameOrId("saved_searches");

    const fieldNames = col.fields.getAll().map(f => f.name);

    try { col.fields.getByName("userId");     } catch(_) { col.fields.add(new TextField({ name: "userId"     })); }
    try { col.fields.getByName("label");      } catch(_) { col.fields.add(new TextField({ name: "label"      })); }
    try { col.fields.getByName("categoryId"); } catch(_) { col.fields.add(new TextField({ name: "categoryId" })); }
    try { col.fields.getByName("location");   } catch(_) { col.fields.add(new TextField({ name: "location"   })); }
    try { col.fields.getByName("keyword");    } catch(_) { col.fields.add(new TextField({ name: "keyword"    })); }

    app.save(col);
    console.log("saved_searches: fields added");
  } catch (e) {
    console.error("add_fields_to_saved_searches failed:", String(e));
  }
}, (app) => {});
