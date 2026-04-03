/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("users");
  const record = new Record(collection);
  record.set("email", "emma.beauty@example.com");
  record.setPassword("TestPass123!");
  record.set("name", "Emma Laurent");
  record.set("userType", "influencer");
  record.set("instagramHandle", "@emmabeauty_pro");
  record.set("instagramFollowers", 412000);
  record.set("youtubeChannel", "Emma Beauty Pro");
  record.set("youtubeFollowers", 156000);
  record.set("contentNiche", "beauty");
  record.set("influencerBio", "Makeup artist & beauty educator. Creating content about skincare, makeup, and self-care. \ud83d\udc84\u2728");
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
    const record = app.findFirstRecordByData("users", "email", "emma.beauty@example.com");
    app.delete(record);
  } catch (e) {
    if (e.message.includes("no rows in result set")) {
      console.log("Auth record not found, skipping rollback");
      return;
    }
    throw e;
  }
})