/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("users");
  const record = new Record(collection);
  record.set("email", "alex.techreview@example.com");
  record.setPassword("TestPass123!");
  record.set("name", "Alex Rodriguez");
  record.set("userType", "influencer");
  record.set("instagramHandle", "@alextech_reviews");
  record.set("instagramFollowers", 156000);
  record.set("youtubeChannel", "Alex Tech Reviews");
  record.set("youtubeFollowers", 342000);
  record.set("tiktokHandle", "@alextechreviews");
  record.set("tiktokFollowers", 890000);
  record.set("contentNiche", "tech");
  record.set("influencerBio", "Tech enthusiast reviewing the latest gadgets and innovations. Subscribe for honest reviews! \ud83d\udd27\ud83d\udcf1");
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
    const record = app.findFirstRecordByData("users", "email", "alex.techreview@example.com");
    app.delete(record);
  } catch (e) {
    if (e.message.includes("no rows in result set")) {
      console.log("Auth record not found, skipping rollback");
      return;
    }
    throw e;
  }
})