/// <reference path="../pb_data/types.d.ts" />

// Temporary diagnostic endpoint — returns saved_searches + messages raw DB row.
// DELETE after debugging.
routerAdd("GET", "/api/debug/schema", (c) => {
  try {
    const ss = $app.db()
      .newQuery("SELECT * FROM _collections WHERE name = 'saved_searches' LIMIT 1")
      .one();
    const msg = $app.db()
      .newQuery("SELECT * FROM _collections WHERE name = 'messages' LIMIT 1")
      .one();

    return c.json(200, {
      saved_searches: Object.fromEntries(ss.columnNames().map(k => [k, ss.get(k)])),
      messages: Object.fromEntries(msg.columnNames().map(k => [k, msg.get(k)])),
    });
  } catch (e) {
    return c.json(500, { error: String(e) });
  }
});
