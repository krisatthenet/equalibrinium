/// <reference path="../pb_data/types.d.ts" />

// Temporary diagnostic endpoint — returns saved_searches + messages raw DB row.
// DELETE after debugging.
routerAdd("GET", "/api/debug/schema", (c) => {
  try {
    // Query both collections via API (not raw SQL)
    const ss  = $app.findCollectionByNameOrId("saved_searches");
    const msg = $app.findCollectionByNameOrId("messages");

    const colToObj = (col) => ({
      id:          col.id,
      name:        col.name,
      listRule:    col.listRule,
      viewRule:    col.viewRule,
      createRule:  col.createRule,
      fieldCount:  col.fields.length,
      fieldNames:  col.fields.getAll ? col.fields.getAll().map(f => f.name) : [],
    });

    return c.json(200, {
      saved_searches: colToObj(ss),
      messages:       colToObj(msg),
    });
  } catch (e) {
    return c.json(500, { error: String(e) });
  }
});
