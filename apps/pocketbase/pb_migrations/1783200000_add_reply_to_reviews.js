/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  try {
    const reviews = app.findCollectionByNameOrId("reviews");

    try { reviews.fields.getByName("reply"); } catch (_) {
      reviews.fields.add(new TextField({ name: "reply", required: false }));
    }

    try { reviews.fields.getByName("repliedAt"); } catch (_) {
      reviews.fields.add(new TextField({ name: "repliedAt", required: false }));
    }

    app.save(reviews);
    console.log("reviews: added reply + repliedAt");
  } catch (e) {
    console.error("add_reply_to_reviews failed:", String(e));
  }
}, (app) => {
  try {
    const reviews = app.findCollectionByNameOrId("reviews");
    try { reviews.fields.removeByName("reply"); } catch (_) {}
    try { reviews.fields.removeByName("repliedAt"); } catch (_) {}
    app.save(reviews);
  } catch (_) {}
});
