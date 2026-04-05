/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const reviews = app.findCollectionByNameOrId("reviews");
  reviews.listRule = "";
  reviews.viewRule = "";
  app.save(reviews);

  // Backfill rating/reviewCount for all contractors
  const allReviews = app.findRecordsByFilter("reviews", "", "", 0, 0);
  const byContractor = {};
  allReviews.forEach(r => {
    const cid = r.getString("contractorId");
    if (!cid) return;
    if (!byContractor[cid]) byContractor[cid] = [];
    byContractor[cid].push(r.getFloat("rating"));
  });

  Object.entries(byContractor).forEach(([cid, ratings]) => {
    try {
      const user = app.findRecordById("users", cid);
      const avg = ratings.reduce((s, r) => s + r, 0) / ratings.length;
      user.set("rating", parseFloat(avg.toFixed(2)));
      user.set("reviewCount", ratings.length);
      app.save(user);
    } catch (_) {}
  });
}, (app) => {
  const reviews = app.findCollectionByNameOrId("reviews");
  reviews.listRule = "@request.auth.id != ''";
  reviews.viewRule = "@request.auth.id != ''";
  app.save(reviews);
})
