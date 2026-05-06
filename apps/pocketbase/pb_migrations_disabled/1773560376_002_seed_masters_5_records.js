/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("masters");

  const record0 = new Record(collection);
    const record0_userIdLookup = app.findFirstRecordByFilter("users", "email='darius@test.com'");
    if (!record0_userIdLookup) { throw new Error("Lookup failed for userId: no record in 'users' matching \"email='darius@test.com'\""); }
    record0.set("userId", record0_userIdLookup.id);
    record0.set("name", "Darius Karpavi\u010dius");
    record0.set("profession", "plyteliu klojimas");
    record0.set("location", "Vilnius");
    record0.set("latitude", 54.6872);
    record0.set("longitude", 25.2797);
    record0.set("rating", 4.8);
    record0.set("reviewCount", 12);
    record0.set("hourlyRate", 25);
  try {
    app.save(record0);
  } catch (e) {
    if (e.message.includes("Value must be unique")) {
      console.log("Record with unique value already exists, skipping");
    } else {
      throw e;
    }
  }

  const record1 = new Record(collection);
    const record1_userIdLookup = app.findFirstRecordByFilter("users", "email='rasa@test.com'");
    if (!record1_userIdLookup) { throw new Error("Lookup failed for userId: no record in 'users' matching \"email='rasa@test.com'\""); }
    record1.set("userId", record1_userIdLookup.id);
    record1.set("name", "Rasa Vaitkut\u0117");
    record1.set("profession", "staliaus paslaugos");
    record1.set("location", "Vilnius");
    record1.set("latitude", 54.69);
    record1.set("longitude", 25.285);
    record1.set("rating", 5.0);
    record1.set("reviewCount", 8);
    record1.set("hourlyRate", 30);
  try {
    app.save(record1);
  } catch (e) {
    if (e.message.includes("Value must be unique")) {
      console.log("Record with unique value already exists, skipping");
    } else {
      throw e;
    }
  }

  const record2 = new Record(collection);
    const record2_userIdLookup = app.findFirstRecordByFilter("users", "email='mindaugas@test.com'");
    if (!record2_userIdLookup) { throw new Error("Lookup failed for userId: no record in 'users' matching \"email='mindaugas@test.com'\""); }
    record2.set("userId", record2_userIdLookup.id);
    record2.set("name", "Mindaugas \u017dukauskas");
    record2.set("profession", "Patalptu valymas");
    record2.set("location", "Vilnius");
    record2.set("latitude", 54.685);
    record2.set("longitude", 25.275);
    record2.set("rating", 4.5);
    record2.set("reviewCount", 15);
    record2.set("hourlyRate", 18);
  try {
    app.save(record2);
  } catch (e) {
    if (e.message.includes("Value must be unique")) {
      console.log("Record with unique value already exists, skipping");
    } else {
      throw e;
    }
  }

  const record3 = new Record(collection);
    const record3_userIdLookup = app.findFirstRecordByFilter("users", "email='kristina@test.com'");
    if (!record3_userIdLookup) { throw new Error("Lookup failed for userId: no record in 'users' matching \"email='kristina@test.com'\""); }
    record3.set("userId", record3_userIdLookup.id);
    record3.set("name", "Kristina Butkien\u0117");
    record3.set("profession", "plyteliu klojimas");
    record3.set("location", "Kaunas");
    record3.set("latitude", 54.8973);
    record3.set("longitude", 23.9021);
    record3.set("rating", 4.9);
    record3.set("reviewCount", 10);
    record3.set("hourlyRate", 28);
  try {
    app.save(record3);
  } catch (e) {
    if (e.message.includes("Value must be unique")) {
      console.log("Record with unique value already exists, skipping");
    } else {
      throw e;
    }
  }

  const record4 = new Record(collection);
    const record4_userIdLookup = app.findFirstRecordByFilter("users", "email='saulius@test.com'");
    if (!record4_userIdLookup) { throw new Error("Lookup failed for userId: no record in 'users' matching \"email='saulius@test.com'\""); }
    record4.set("userId", record4_userIdLookup.id);
    record4.set("name", "Saulius Rimkus");
    record4.set("profession", "staliaus paslaugos");
    record4.set("location", "Vilnius");
    record4.set("latitude", 54.692);
    record4.set("longitude", 25.29);
    record4.set("rating", 4.7);
    record4.set("reviewCount", 9);
    record4.set("hourlyRate", 32);
  try {
    app.save(record4);
  } catch (e) {
    if (e.message.includes("Value must be unique")) {
      console.log("Record with unique value already exists, skipping");
    } else {
      throw e;
    }
  }
}, (app) => {
  // Rollback: record IDs not known, manual cleanup needed
})