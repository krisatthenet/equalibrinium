/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("categories");

  const record0 = new Record(collection);
    record0.set("name", "Apdailos darbai");
    record0.set("description", "Vidaus ir i\u0161or\u0117s apdailos darbai");
    record0.set("icon", "paint-brush");
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
    record1.set("name", "Tapetavimas");
    record1.set("description", "Tapet\u0173 klijavimas ir keitimas");
    record1.set("icon", "wallpaper");
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
    record2.set("name", "Bald\u0173 surinkimas");
    record2.set("description", "Bald\u0173 montavimas ir surinkimas");
    record2.set("icon", "sofa");
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
    record3.set("name", "Grind\u0173 klojimas");
    record3.set("description", "Grind\u0173 klojimas ir remontas");
    record3.set("icon", "floor");
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
    record4.set("name", "Elektrika");
    record4.set("description", "Elektriniai darbai ir instaliacijos");
    record4.set("icon", "zap");
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
    record5.set("name", "Santechnika");
    record5.set("description", "Santechnikos darbai ir remontas");
    record5.set("icon", "droplet");
  try {
    app.save(record5);
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