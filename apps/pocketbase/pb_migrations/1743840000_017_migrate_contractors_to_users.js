/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  // -------------------------------------------------------------------------
  // 1. Add contractor profile fields to users
  // -------------------------------------------------------------------------
  const users = app.findCollectionByNameOrId("users");
  let categoriesCollection;
  try {
    categoriesCollection = app.findCollectionByNameOrId("categories");
  } catch (e) {
    console.log("categories collection not found, skipping relation field: " + e.message);
  }

  const textFields = [
    { id: "text_user_bio", name: "bio" },
    { id: "text_user_profession", name: "profession" },
  ];
  for (const f of textFields) {
    if (!users.fields.getByName(f.name)) {
      users.fields.add(new Field({
        hidden: false, id: f.id, name: f.name, type: "text",
        required: false, system: false, presentable: false,
        autogeneratePattern: "", max: 0, min: 0, pattern: ""
      }));
    }
  }

  const numberFields = [
    { id: "number_user_rating", name: "rating", min: 0, max: 5 },
    { id: "number_user_review_count", name: "reviewCount", min: 0, max: null },
    { id: "number_user_hourly_rate", name: "hourlyRate", min: 0, max: null },
    { id: "number_user_latitude", name: "latitude", min: null, max: null },
    { id: "number_user_longitude", name: "longitude", min: null, max: null },
  ];
  for (const f of numberFields) {
    if (!users.fields.getByName(f.name)) {
      users.fields.add(new Field({
        hidden: false, id: f.id, name: f.name, type: "number",
        required: false, system: false, presentable: false,
        min: f.min, max: f.max, onlyInt: false
      }));
    }
  }

  if (!users.fields.getByName("isPromoted")) {
    users.fields.add(new Field({
      hidden: false, id: "bool_user_is_promoted", name: "isPromoted",
      type: "bool", required: false, system: false, presentable: false
    }));
  }

  if (categoriesCollection && !users.fields.getByName("categories")) {
    users.fields.add(new Field({
      hidden: false, id: "relation_user_categories", name: "categories",
      type: "relation", required: false, system: false, presentable: false,
      cascadeDelete: false, collectionId: categoriesCollection.id,
      displayFields: [], maxSelect: 10, minSelect: 0
    }));
  }

  // Allow both "master" and "contractor" during transition
  const userTypeField = users.fields.getByName("userType");
  if (userTypeField) {
    userTypeField.values = ["client", "master", "contractor", "influencer"];
  }

  app.save(users);

  // -------------------------------------------------------------------------
  // 2. Copy contractor records → users
  // -------------------------------------------------------------------------
  let contractorRecords;
  try {
    contractorRecords = app.findAllRecords("contractors", $dbx.exp("id != ''"));
  } catch (e) {
    console.log("contractors collection not found, skipping migration: " + e.message);
    contractorRecords = [];
  }

  for (const c of contractorRecords) {
    const userId = c.getString("userId");
    if (!userId) continue;
    try {
      const user = app.findRecordById("users", userId);
      const bio = c.getString("bio");
      const profession = c.getString("profession");
      if (bio) user.set("bio", bio);
      if (profession) user.set("profession", profession);
      user.set("rating", c.getFloat("rating") || 0);
      user.set("reviewCount", c.getInt("reviewCount") || 0);
      user.set("hourlyRate", c.getFloat("hourlyRate") || 0);
      user.set("latitude", c.getFloat("latitude") || 0);
      user.set("longitude", c.getFloat("longitude") || 0);
      user.set("isPromoted", c.getBool("isPromoted") || false);
      const cats = c.get("categories");
      if (cats && Array.isArray(cats) && cats.length > 0) {
        user.set("categories", cats);
      }
      app.save(user);
    } catch (e) {
      console.log("Error migrating contractor userId=" + userId + ": " + e.message);
    }
  }

  // -------------------------------------------------------------------------
  // 3. Migrate auction_tickets.assignedContractorId → user ID
  // -------------------------------------------------------------------------
  try {
    const allTickets = app.findAllRecords("auction_tickets", $dbx.exp("id != ''"));
    for (const ticket of allTickets) {
      const assignedId = ticket.getString("assignedContractorId");
      if (!assignedId) continue;
      try {
        const cRec = app.findRecordById("contractors", assignedId);
        const userId = cRec.getString("userId");
        if (userId) {
          ticket.set("assignedContractorId", userId);
          app.save(ticket);
        }
      } catch (e) {
        // contractor record not found (already a user ID, or deleted)
      }
    }
  } catch (e) {
    console.log("Error migrating assignedContractorId: " + e.message);
  }

  // -------------------------------------------------------------------------
  // 4. Migrate favourites.contractorId → user ID
  // -------------------------------------------------------------------------
  try {
    const allFavs = app.findAllRecords("favourites", $dbx.exp("id != ''"));
    for (const fav of allFavs) {
      const contractorRecordId = fav.getString("contractorId");
      if (!contractorRecordId) continue;
      try {
        const cRec = app.findRecordById("contractors", contractorRecordId);
        const userId = cRec.getString("userId");
        if (userId) {
          fav.set("contractorId", userId);
          app.save(fav);
        }
      } catch (e) {}
    }
  } catch (e) {
    console.log("Error migrating favourites: " + e.message);
  }

  // -------------------------------------------------------------------------
  // 5. Normalize userType: "master" → "contractor"
  // -------------------------------------------------------------------------
  try {
    const masters = app.findAllRecords("users", $dbx.hashExp({ userType: "master" }));
    for (const user of masters) {
      user.set("userType", "contractor");
      app.save(user);
    }
  } catch (e) {
    console.log("Error normalizing userType: " + e.message);
  }

  // -------------------------------------------------------------------------
  // 6. Remove "master" from userType allowed values
  // -------------------------------------------------------------------------
  const usersAfter = app.findCollectionByNameOrId("users");
  const typeField = usersAfter.fields.getByName("userType");
  if (typeField) {
    typeField.values = ["client", "contractor", "influencer"];
  }
  app.save(usersAfter);

  // -------------------------------------------------------------------------
  // 7. Delete contractors collection
  // -------------------------------------------------------------------------
  try {
    const contractorsCol = app.findCollectionByNameOrId("contractors");
    app.delete(contractorsCol);
    console.log("Deleted contractors collection");
  } catch (e) {
    console.log("Error deleting contractors collection: " + e.message);
  }

}, (app) => {
  // Rollback not fully supported — data migration is one-way
  // Re-add "master" to userType values as minimal revert
  try {
    const users = app.findCollectionByNameOrId("users");
    const typeField = users.fields.getByName("userType");
    if (typeField) typeField.values = ["client", "master", "contractor", "influencer"];
    app.save(users);
  } catch (e) {}
});
