/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("categories");

  const records = [
    { name: "Painter",          description: "Painting and decorating",          icon: "paint-roller" },
    { name: "Artist",           description: "Fine arts and creative work",       icon: "palette" },
    { name: "Digital Creator",  description: "Digital content creation",          icon: "monitor" },
    { name: "Graffiti Artist",  description: "Graffiti and street art",           icon: "spray-can" },
    { name: "Nurse",            description: "Nursing and patient care",           icon: "heart-pulse" },
    { name: "Doctor",           description: "Medical services and consultations", icon: "stethoscope" },
    { name: "Mentor",           description: "Mentoring and guidance",             icon: "lightbulb" },
    { name: "Correpetitor",     description: "Musical coaching and accompaniment", icon: "music" },
    { name: "Teacher",          description: "Teaching and education",             icon: "book-open" },
    { name: "Coach",            description: "Sports coaching (specify sport)",    icon: "trophy" },
  ];

  for (const r of records) {
    const record = new Record(collection);
    record.set("name", r.name);
    record.set("description", r.description);
    record.set("icon", r.icon);
    try {
      app.save(record);
    } catch (e) {
      if (e.message.includes("Value must be unique")) {
        console.log(`Skipping duplicate: ${r.name}`);
      } else {
        throw e;
      }
    }
  }
}, (app) => {
  const collection = app.findCollectionByNameOrId("categories");
  const names = ["Painter","Artist","Digital Creator","Graffiti Artist","Nurse","Doctor","Mentor","Correpetitor","Teacher","Coach"];
  for (const name of names) {
    try {
      const record = app.findFirstRecordByData("categories", "name", name);
      app.delete(record);
    } catch (_) {}
  }
});
