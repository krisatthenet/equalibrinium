/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const col = app.findCollectionByNameOrId("portfolio_items");

  if (!col.fields.getByName("beforePhotos")) {
    col.fields.add(new FileField({ name: "beforePhotos", maxSelect: 5, maxSize: 10485760 }));
  }
  if (!col.fields.getByName("afterPhotos")) {
    col.fields.add(new FileField({ name: "afterPhotos", maxSelect: 5, maxSize: 10485760 }));
  }

  app.save(col);
  console.log("beforePhotos + afterPhotos added to portfolio_items");
}, (app) => {
  try {
    const col = app.findCollectionByNameOrId("portfolio_items");
    col.fields.removeByName("beforePhotos");
    col.fields.removeByName("afterPhotos");
    app.save(col);
  } catch (_) {}
});
