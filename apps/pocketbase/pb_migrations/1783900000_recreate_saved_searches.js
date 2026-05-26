/// <reference path="../pb_data/types.d.ts" />

// Drop and recreate saved_searches so fields are properly defined.
// Previous migrations created the collection but fields weren't persisted.
migrate((app) => {
  // Drop existing (empty test data only)
  try {
    const existing = app.findCollectionByNameOrId("saved_searches");
    app.delete(existing);
    console.log("saved_searches: dropped existing collection");
  } catch (_) {}

  const col = new Collection();
  col.name       = "saved_searches";
  col.type       = "base";
  col.listRule   = '@request.auth.id != ""';
  col.viewRule   = '@request.auth.id != ""';
  col.createRule = '@request.auth.id != ""';
  col.updateRule = '@request.auth.id != ""';
  col.deleteRule = '@request.auth.id != ""';

  col.fields.add(new TextField({ name: "userId"     }));
  col.fields.add(new TextField({ name: "label"      }));
  col.fields.add(new TextField({ name: "categoryId" }));
  col.fields.add(new TextField({ name: "location"   }));
  col.fields.add(new TextField({ name: "keyword"    }));

  app.save(col);
  console.log("saved_searches: recreated with fields");
}, (app) => {
  try {
    const c = app.findCollectionByNameOrId("saved_searches");
    app.delete(c);
  } catch (_) {}
});
