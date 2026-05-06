/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("auction_tickets");

  const record0 = new Record(collection);
    const record0_clientIdLookup = app.findFirstRecordByFilter("users", "email='jurgita@test.com'");
    if (!record0_clientIdLookup) { throw new Error("Lookup failed for clientId: no record in 'users' matching \"email='jurgita@test.com'\""); }
    record0.set("clientId", record0_clientIdLookup.id);
    const record0_categoryIdLookup = app.findFirstRecordByFilter("categories", "name='plyteliu klojimas'");
    if (!record0_categoryIdLookup) { throw new Error("Lookup failed for categoryId: no record in 'categories' matching \"name='plyteliu klojimas'\""); }
    record0.set("categoryId", record0_categoryIdLookup.id);
    record0.set("description", "Reikalinga plyteli\u0173 klojimas vonios kambaryje. Plotas apie 8 m2");
    record0.set("budget", 250);
    record0.set("location", "Vilnius, Gedimino pr. 1");
    record0.set("latitude", 54.6872);
    record0.set("longitude", 25.2797);
    record0.set("status", "Open");
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
    const record1_clientIdLookup = app.findFirstRecordByFilter("users", "email='andrius@test.com'");
    if (!record1_clientIdLookup) { throw new Error("Lookup failed for clientId: no record in 'users' matching \"email='andrius@test.com'\""); }
    record1.set("clientId", record1_clientIdLookup.id);
    const record1_categoryIdLookup = app.findFirstRecordByFilter("categories", "name='staliaus paslaugos'");
    if (!record1_categoryIdLookup) { throw new Error("Lookup failed for categoryId: no record in 'categories' matching \"name='staliaus paslaugos'\""); }
    record1.set("categoryId", record1_categoryIdLookup.id);
    record1.set("description", "Pagaminti medin\u0119 virtuv\u0117s spintel\u0119 pagal br\u0117\u017ein\u012f");
    record1.set("budget", 400);
    record1.set("location", "Kaunas, Laisv\u0117s al. 50");
    record1.set("latitude", 54.8973);
    record1.set("longitude", 23.9021);
    record1.set("status", "Open");
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
    const record2_clientIdLookup = app.findFirstRecordByFilter("users", "email='laima@test.com'");
    if (!record2_clientIdLookup) { throw new Error("Lookup failed for clientId: no record in 'users' matching \"email='laima@test.com'\""); }
    record2.set("clientId", record2_clientIdLookup.id);
    const record2_categoryIdLookup = app.findFirstRecordByFilter("categories", "name='Patalptu valymas'");
    if (!record2_categoryIdLookup) { throw new Error("Lookup failed for categoryId: no record in 'categories' matching \"name='Patalptu valymas'\""); }
    record2.set("categoryId", record2_categoryIdLookup.id);
    record2.set("description", "Biuro patalp\u0173 valymas 200 m2");
    record2.set("budget", 150);
    record2.set("location", "Vilnius, Konstitucijos pr. 5");
    record2.set("latitude", 54.685);
    record2.set("longitude", 25.275);
    record2.set("status", "Open");
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
    const record3_clientIdLookup = app.findFirstRecordByFilter("users", "email='jurgita@test.com'");
    if (!record3_clientIdLookup) { throw new Error("Lookup failed for clientId: no record in 'users' matching \"email='jurgita@test.com'\""); }
    record3.set("clientId", record3_clientIdLookup.id);
    const record3_categoryIdLookup = app.findFirstRecordByFilter("categories", "name='plyteliu klojimas'");
    if (!record3_categoryIdLookup) { throw new Error("Lookup failed for categoryId: no record in 'categories' matching \"name='plyteliu klojimas'\""); }
    record3.set("categoryId", record3_categoryIdLookup.id);
    record3.set("description", "Grind\u0173 plyteli\u0173 klojimas virtuv\u0117je");
    record3.set("budget", 300);
    record3.set("location", "Vilnius, Gedimino pr. 1");
    record3.set("latitude", 54.6872);
    record3.set("longitude", 25.2797);
    record3.set("status", "In Progress");
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
    const record4_clientIdLookup = app.findFirstRecordByFilter("users", "email='vytautas@test.com'");
    if (!record4_clientIdLookup) { throw new Error("Lookup failed for clientId: no record in 'users' matching \"email='vytautas@test.com'\""); }
    record4.set("clientId", record4_clientIdLookup.id);
    const record4_categoryIdLookup = app.findFirstRecordByFilter("categories", "name='staliaus paslaugos'");
    if (!record4_categoryIdLookup) { throw new Error("Lookup failed for categoryId: no record in 'categories' matching \"name='staliaus paslaugos'\""); }
    record4.set("categoryId", record4_categoryIdLookup.id);
    record4.set("description", "Sumontuoti spintas ir lentyn\u0173 sistem\u0105");
    record4.set("budget", 350);
    record4.set("location", "Vilnius, Savanoriu pr. 10");
    record4.set("latitude", 54.692);
    record4.set("longitude", 25.29);
    record4.set("status", "Open");
  try {
    app.save(record4);
  } catch (e) {
    if (e.message.includes("Value must be unique")) {
      console.log("Record with unique value already exists, skipping");
    } else {
      throw e;
    }
  }

  const record5 = new Record(collection);
    const record5_clientIdLookup = app.findFirstRecordByFilter("users", "email='laima@test.com'");
    if (!record5_clientIdLookup) { throw new Error("Lookup failed for clientId: no record in 'users' matching \"email='laima@test.com'\""); }
    record5.set("clientId", record5_clientIdLookup.id);
    const record5_categoryIdLookup = app.findFirstRecordByFilter("categories", "name='plyteliu klojimas'");
    if (!record5_categoryIdLookup) { throw new Error("Lookup failed for categoryId: no record in 'categories' matching \"name='plyteliu klojimas'\""); }
    record5.set("categoryId", record5_categoryIdLookup.id);
    record5.set("description", "Vonios plyteli\u0173 klojimas ir silikono tarpai");
    record5.set("budget", 280);
    record5.set("location", "Vilnius, Konstitucijos pr. 5");
    record5.set("latitude", 54.685);
    record5.set("longitude", 25.275);
    record5.set("status", "Completed");
  try {
    app.save(record5);
  } catch (e) {
    if (e.message.includes("Value must be unique")) {
      console.log("Record with unique value already exists, skipping");
    } else {
      throw e;
    }
  }

  const record6 = new Record(collection);
    const record6_clientIdLookup = app.findFirstRecordByFilter("users", "email='andrius@test.com'");
    if (!record6_clientIdLookup) { throw new Error("Lookup failed for clientId: no record in 'users' matching \"email='andrius@test.com'\""); }
    record6.set("clientId", record6_clientIdLookup.id);
    const record6_categoryIdLookup = app.findFirstRecordByFilter("categories", "name='Patalptu valymas'");
    if (!record6_categoryIdLookup) { throw new Error("Lookup failed for categoryId: no record in 'categories' matching \"name='Patalptu valymas'\""); }
    record6.set("categoryId", record6_categoryIdLookup.id);
    record6.set("description", "Nam\u0173 valymas po remonto");
    record6.set("budget", 200);
    record6.set("location", "Kaunas, Laisv\u0117s al. 50");
    record6.set("latitude", 54.8973);
    record6.set("longitude", 23.9021);
    record6.set("status", "Open");
  try {
    app.save(record6);
  } catch (e) {
    if (e.message.includes("Value must be unique")) {
      console.log("Record with unique value already exists, skipping");
    } else {
      throw e;
    }
  }

  const record7 = new Record(collection);
    const record7_clientIdLookup = app.findFirstRecordByFilter("users", "email='vytautas@test.com'");
    if (!record7_clientIdLookup) { throw new Error("Lookup failed for clientId: no record in 'users' matching \"email='vytautas@test.com'\""); }
    record7.set("clientId", record7_clientIdLookup.id);
    const record7_categoryIdLookup = app.findFirstRecordByFilter("categories", "name='Patalptu valymas'");
    if (!record7_categoryIdLookup) { throw new Error("Lookup failed for categoryId: no record in 'categories' matching \"name='Patalptu valymas'\""); }
    record7.set("categoryId", record7_categoryIdLookup.id);
    record7.set("description", "Reguliarus biuro valymas 2x per savait\u0119");
    record7.set("budget", 120);
    record7.set("location", "Vilnius, Savanoriu pr. 10");
    record7.set("latitude", 54.692);
    record7.set("longitude", 25.29);
    record7.set("status", "Open");
  try {
    app.save(record7);
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