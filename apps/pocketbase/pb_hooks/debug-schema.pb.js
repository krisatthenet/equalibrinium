/// <reference path="../pb_data/types.d.ts" />

// Temporary diagnostic endpoint — returns saved_searches + messages raw DB row.
// DELETE after debugging.
routerAdd("GET", "/api/debug/schema", (c) => {
  try {
    const ss = $app.findCollectionByNameOrId("saved_searches");
    return c.json(200, {
      id:         ss.id,
      name:       ss.name,
      listRule:   ss.listRule,
      viewRule:   ss.viewRule,
      createRule: ss.createRule,
    });
  } catch (e) {
    return c.json(500, { error: String(e) });
  }
});
