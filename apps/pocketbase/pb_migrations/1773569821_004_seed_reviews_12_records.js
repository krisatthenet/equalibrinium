/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("reviews");

  const record0 = new Record(collection);
    record0.set("contractorId", "contractor_001");
    record0.set("clientId", "client_001");
    record0.set("rating", 5);
    record0.set("comment", "Excellent work! The contractor was professional, punctual, and delivered exactly what was promised. Highly recommend!");
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
    record1.set("contractorId", "contractor_002");
    record1.set("clientId", "client_002");
    record1.set("rating", 4);
    record1.set("comment", "Great service overall. Very skilled and efficient. Minor communication delays but final result was outstanding.");
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
    record2.set("contractorId", "contractor_003");
    record2.set("clientId", "client_003");
    record2.set("rating", 5);
    record2.set("comment", "Outstanding quality and attention to detail. The contractor went above and beyond expectations. Will definitely hire again!");
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
    record3.set("contractorId", "contractor_001");
    record3.set("clientId", "client_004");
    record3.set("rating", 4);
    record3.set("comment", "Professional and reliable. Completed the project on time and within budget. Very satisfied with the results.");
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
    record4.set("contractorId", "contractor_004");
    record4.set("clientId", "client_005");
    record4.set("rating", 5);
    record4.set("comment", "Fantastic experience from start to finish. The contractor was responsive, creative, and delivered exceptional work quality.");
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
    record5.set("contractorId", "contractor_002");
    record5.set("clientId", "client_006");
    record5.set("rating", 4);
    record5.set("comment", "Good work and fair pricing. The contractor was knowledgeable and provided helpful suggestions throughout the project.");
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
    record6.set("contractorId", "contractor_005");
    record6.set("clientId", "client_007");
    record6.set("rating", 5);
    record6.set("comment", "Perfect! Exactly what I needed. The contractor understood my vision and executed it flawlessly. Highly professional!");
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
    record7.set("contractorId", "contractor_003");
    record7.set("clientId", "client_008");
    record7.set("rating", 4);
    record7.set("comment", "Very competent and thorough. Took time to explain everything and ensure I was satisfied. Great communication skills.");
  try {
    app.save(record7);
  } catch (e) {
    if (e.message.includes("Value must be unique")) {
      console.log("Record with unique value already exists, skipping");
    } else {
      throw e;
    }
  }

  const record8 = new Record(collection);
    record8.set("contractorId", "contractor_006");
    record8.set("clientId", "client_009");
    record8.set("rating", 5);
    record8.set("comment", "Exceptional service! The contractor was innovative, efficient, and delivered results beyond my expectations.");
  try {
    app.save(record8);
  } catch (e) {
    if (e.message.includes("Value must be unique")) {
      console.log("Record with unique value already exists, skipping");
    } else {
      throw e;
    }
  }

  const record9 = new Record(collection);
    record9.set("contractorId", "contractor_004");
    record9.set("clientId", "client_010");
    record9.set("rating", 4);
    record9.set("comment", "Solid work quality. The contractor was professional and easy to work with. Would recommend to others.");
  try {
    app.save(record9);
  } catch (e) {
    if (e.message.includes("Value must be unique")) {
      console.log("Record with unique value already exists, skipping");
    } else {
      throw e;
    }
  }

  const record10 = new Record(collection);
    record10.set("contractorId", "contractor_005");
    record10.set("clientId", "client_011");
    record10.set("rating", 5);
    record10.set("comment", "Outstanding! The contractor showed great expertise and delivered premium quality work. Very impressed!");
  try {
    app.save(record10);
  } catch (e) {
    if (e.message.includes("Value must be unique")) {
      console.log("Record with unique value already exists, skipping");
    } else {
      throw e;
    }
  }

  const record11 = new Record(collection);
    record11.set("contractorId", "contractor_006");
    record11.set("clientId", "client_012");
    record11.set("rating", 4);
    record11.set("comment", "Good experience overall. Professional approach and quality results. Minor delays but nothing major.");
  try {
    app.save(record11);
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