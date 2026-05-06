/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const contractorsCol = app.findCollectionByNameOrId("contractors");
  const usersCol = app.findCollectionByNameOrId("users");

  // City → approximate coordinates map
  const cityCoords = {
    "vilnius":  { lat: 54.6872, lng: 25.2797 },
    "kaunas":   { lat: 54.8985, lng: 23.9036 },
    "klaipeda": { lat: 55.7033, lng: 21.1443 },
    "siauliai":  { lat: 55.9333, lng: 23.3167 },
    "panevezys": { lat: 55.7333, lng: 24.3500 },
  };

  // Find all master/contractor users
  const masterUsers = app.findAllRecords("users", $dbx.hashExp({userType: "master"}));
  const contractorUsers = app.findAllRecords("users", $dbx.hashExp({userType: "contractor"}));
  const allContractors = [...masterUsers, ...contractorUsers];

  for (const user of allContractors) {
    // Check if a contractors record already exists for this user
    let existing;
    try {
      existing = app.findFirstRecordByFilter("contractors", `userId = "${user.id}"`);
    } catch (e) {
      existing = null;
    }
    if (existing) continue;

    // Get coordinates from location string
    const locationLower = (user.getString("location") || "").toLowerCase().trim();
    const coords = cityCoords[locationLower] || cityCoords["vilnius"];

    const record = new Record(contractorsCol);
    record.set("userId", user.id);
    record.set("name", user.getString("name"));
    record.set("profession", user.getString("profession") || "");
    record.set("location", user.getString("location") || "");
    record.set("latitude", coords.lat);
    record.set("longitude", coords.lng);
    record.set("rating", 0);
    record.set("reviewCount", 0);
    record.set("hourlyRate", 0);
    record.set("isPromoted", false);

    try {
      app.save(record);
      console.log(`Created contractor record for user: ${user.getString("email")}`);
    } catch (e) {
      console.log(`Failed to create contractor record for ${user.getString("email")}: ${e.message}`);
    }
  }
}, (app) => {
  // No rollback — backfill only
});
