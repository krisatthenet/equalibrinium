/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("users");
  const record = new Record(collection);
  record.set("email", "sophia.wellness@example.com");
  record.setPassword("TestPass123!");
  record.set("name", "Sophia Chen");
  record.set("userType", "influencer");
  record.set("instagramHandle", "@sophiawellness");
  record.set("instagramFollowers", 245000);
  record.set("youtubeChannel", "Sophia Wellness");
  record.set("youtubeFollowers", 87000);
  record.set("tiktokHandle", "@sophiawellness");
  record.set("tiktokFollowers", 520000);
  record.set("contentNiche", "wellness");
  record.set("influencerBio", "Fitness coach & wellness advocate. Sharing daily tips for a healthier lifestyle. \ud83d\udcaa\u2728");
  try {
    return app.save(record);
  } catch (e) {
    if (e.message.includes("Value must be unique")) {
      console.log("Record with unique value already exists, skipping");
      return;
    }
    throw e;
  }
}, (app) => {
  try {
    const record = app.findFirstRecordByData("users", "email", "sophia.wellness@example.com");
    app.delete(record);
  } catch (e) {
    if (e.message.includes("no rows in result set")) {
      console.log("Auth record not found, skipping rollback");
      return;
    }
    throw e;
  }
})