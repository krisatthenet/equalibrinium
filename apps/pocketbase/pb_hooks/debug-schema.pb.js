/// <reference path="../pb_data/types.d.ts" />
// CACHEBUST=21 verification hook
routerAdd("GET", "/debug/v21", (c) => {
  return c.json(200, { version: 21, hooks_loaded: true });
});
