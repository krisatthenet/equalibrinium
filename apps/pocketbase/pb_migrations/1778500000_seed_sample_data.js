/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  try {
  const users = app.findCollectionByNameOrId("users");
  const tickets = app.findCollectionByNameOrId("auction_tickets");
  const bidsCol = app.findCollectionByNameOrId("bids");
  const reviewsCol = app.findCollectionByNameOrId("reviews");

  // Resolve categories by name
  function getCategoryId(name) {
    try {
      const cats = app.findAllRecords("categories", $dbx.like("name", name));
      return cats.length > 0 ? cats[0].id : null;
    } catch (_) { return null; }
  }

  const catPlumbing    = getCategoryId("Santechnika");
  const catElectric    = getCategoryId("Elektrika");
  const catFinishing   = getCategoryId("Apdailos");
  const catFlooring    = getCategoryId("Grind");
  const catFurniture   = getCategoryId("Bald");
  const catTiling      = getCategoryId("plyteliu");

  // --- Clients ---
  function upsertUser(email, name, type, phone, location, extra) {
    const existing = app.findAllRecords("users", $dbx.hashExp({ email }));
    if (existing.length > 0) return existing[0].id;
    const r = new Record(users);
    r.set("email", email);
    r.set("password", "Test1234!");
    r.set("passwordConfirm", "Test1234!");
    r.set("name", name);
    r.set("userType", type);
    r.set("phone", phone);
    r.set("location", location);
    if (extra) for (const [k, v] of Object.entries(extra)) r.set(k, v);
    app.saveNoValidate(r);
    return r.id;
  }

  const client1 = upsertUser("laima@test.lt",    "Laima Kazlauskienė", "client", "+37061100001", "Vilnius", {});
  const client2 = upsertUser("tomas@test.lt",    "Tomas Petrauskas",   "client", "+37061100002", "Kaunas",  {});
  const client3 = upsertUser("rasa@test.lt",     "Rasa Jankaitytė",    "client", "+37061100003", "Klaipėda",{});

  const master1 = upsertUser("jonas@test.lt",    "Jonas Žukauskas",    "contractor", "+37061200001", "Vilnius",  { title: "Santechnikas" });
  const master2 = upsertUser("andrius@test.lt",  "Andrius Stankevičius","contractor","+37061200002", "Vilnius",  { title: "Elektrikas" });
  const master3 = upsertUser("darius@test.lt",   "Darius Mačiulis",    "contractor", "+37061200003", "Kaunas",   { title: "Apdailininkas" });
  const master4 = upsertUser("vytautas@test.lt", "Vytautas Balčiūnas",  "contractor","+37061200004", "Klaipėda", { title: "Grindų meistras" });

  // --- Auction tickets ---
  function createTicket(clientId, categoryId, desc, budget, location, lat, lng, duration, status) {
    const r = new Record(tickets);
    r.set("clientId", clientId);
    r.set("categoryId", categoryId || "");
    r.set("description", desc);
    r.set("budget", budget);
    r.set("location", location);
    r.set("latitude", lat);
    r.set("longitude", lng);
    r.set("durationEstimate", duration);
    r.set("status", status);
    app.save(r);
    return r.id;
  }

  const ticket1 = createTicket(client1, catPlumbing,
    "Reikia pakeisti vonios kambario santechniką – kriauklę, tualetą ir dušo maišytuvą. Butas antrame aukšte.",
    350, "Vilnius, Žirmūnai", 54.7051, 25.2797, "2–3 dienos", "Open");

  const ticket2 = createTicket(client2, catElectric,
    "Reikia įrengti naują elektros instaliaciją 3 kambarių bute. Visi laidai keičiami nuo skydo.",
    1200, "Kaunas, Centras", 54.8985, 23.9036, "1 savaitė", "In Progress");

  const ticket3 = createTicket(client1, catFinishing,
    "Dažyti 2 miegamuosius (bendras plotas ~30 m²). Sienos jau paruoštos, reikia tik dažyti.",
    200, "Vilnius, Antakalnis", 54.6985, 25.2994, "1–2 dienos", "Open");

  const ticket4 = createTicket(client3, catFlooring,
    "Kloti laminatą svetainėje (~25 m²) ir koridoriuje (~8 m²). Medžiagos yra.",
    400, "Klaipėda, Centras", 55.7033, 21.1443, "2 dienos", "Completed");

  const ticket5 = createTicket(client2, catTiling,
    "Kloti plytelės virtuvėje ant grindų ir sienos (apie 15 m²). Sutvarkytos grindys.",
    550, "Kaunas, Šilainiai", 54.9194, 23.8714, "3 dienos", "Open");

  // --- Bids ---
  function createBid(ticketId, masterId, rate, message, status) {
    const r = new Record(bidsCol);
    r.set("ticketId", ticketId);
    r.set("masterId", masterId);
    r.set("proposedRate", rate);
    r.set("message", message);
    r.set("status", status);
    app.save(r);
    return r.id;
  }

  // Ticket 1 (plumbing) – 2 bids
  const bid1 = createBid(ticket1, master1, 320,
    "Turiu 10 metų patirties santechnikoje. Galiu pradėti rytoj. Į kainą įeina medžiagos.",
    "pending");
  const bid2 = createBid(ticket1, master3, 380,
    "Atliksiu greitai ir kokybiškai. Dirbau panašiuose projektuose Žirmūnuose.",
    "pending");

  // Ticket 2 (electric) – 2 bids, one accepted
  const bid3 = createBid(ticket2, master2, 1100,
    "Esu sertifikuotas elektrikas. Įrengiau instaliaciją daugiau nei 50 butų. Garantija 2 metai.",
    "accepted");
  const bid4 = createBid(ticket2, master1, 1350,
    "Galiu atlikti elektrikos darbus, turiu reikalingus leidimus.",
    "rejected");

  // Ticket 3 (finishing) – 1 bid
  const bid5 = createBid(ticket3, master3, 180,
    "Dažau greitai ir tiksliai. Turėsiu laiko kitą savaitę.",
    "pending");

  // Ticket 4 (flooring, completed) – 1 accepted bid
  const bid6 = createBid(ticket4, master4, 390,
    "Laminato klojimas yra mano specializacija. Garantuoju švarų ir tikslų darbą.",
    "accepted");

  // Ticket 5 (tiling) – 2 bids
  const bid7 = createBid(ticket5, master3, 500,
    "Kloju plytelę jau 8 metus. Turiu visus įrankius, galiu pradėti kitą pirmadienį.",
    "pending");
  const bid8 = createBid(ticket5, master4, 580,
    "Kokybiškas ir greitas darbas. Pateikiu 1 metų garantiją ant darbo.",
    "pending");

  // Update accepted bid references
  try {
    const t2 = app.findRecordById("auction_tickets", ticket2);
    t2.set("acceptedBidId", bid3);
    app.save(t2);
  } catch (_) {}

  try {
    const t4 = app.findRecordById("auction_tickets", ticket4);
    t4.set("acceptedBidId", bid6);
    app.save(t4);
  } catch (_) {}

  // --- Reviews (for completed ticket4) ---
  function createReview(contractorId, clientId, rating, comment) {
    const r = new Record(reviewsCol);
    // field name after rename migration
    try {
      r.set("contractorId", contractorId);
    } catch (_) {
      r.set("masterId", contractorId);
    }
    r.set("clientId", clientId);
    r.set("rating", rating);
    r.set("comment", comment);
    app.save(r);
    return r.id;
  }

  createReview(master4, client3, 5,
    "Puikus darbas! Laminatas padėtas tiksliai, tvarkingai. Rekomenduoju.");
  createReview(master2, client2, 5,
    "Andrius – profesionalas. Baigė darbą per 4 dienas, viską sutvarkė švariai.");
  createReview(master1, client1, 4,
    "Gerai atliktas darbas, tik šiek tiek vėlavo. Apskritai patenkinta.");
  createReview(master3, client2, 5,
    "Greitas ir kokybiškas. Tikrai kreipsiuosi dar kartą.");

  console.log("Sample data seeded successfully");
  } catch(e) { console.log("Seed skipped (non-fatal): " + e.message); }
}, (app) => {
  // Rollback: remove seeded users by email
  const emails = [
    "laima@test.lt", "tomas@test.lt", "rasa@test.lt",
    "jonas@test.lt", "andrius@test.lt", "darius@test.lt", "vytautas@test.lt",
  ];
  for (const email of emails) {
    try {
      const r = app.findAllRecords("users", $dbx.hashExp({ email }));
      if (r.length > 0) app.delete(r[0]);
    } catch (_) {}
  }
});
