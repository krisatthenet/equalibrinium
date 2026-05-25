// After a contractor sends a message, sample how long they took to reply
// (gap from the previous non-contractor message on the same ticket).
// Stores a rolling average in users.avgResponseMs + users.responseCount.

onRecordAfterCreateSuccess((e) => {
  const msg = e.record;
  const senderId = msg.getString("senderId");
  const ticketId = msg.getString("ticketId");
  const createdStr = msg.getString("created");

  if (!senderId || !ticketId) return;

  try {
    const sender = $app.findRecordById("users", senderId);
    if (sender.getString("userType") !== "contractor") return;

    // Most recent message on this ticket sent by someone else, before this one
    const prevMsgs = $app.findRecordsByFilter(
      "messages",
      `ticketId = "${ticketId}" && senderId != "${senderId}" && created < "${createdStr}"`,
      "-created", 1, 0
    );
    if (!prevMsgs || !prevMsgs.length) return;

    const prevCreatedStr = prevMsgs[0].getString("created");
    const responseMs = new Date(createdStr).getTime() - new Date(prevCreatedStr).getTime();

    // Discard samples outside a sensible range (< 1 min or > 7 days — noise or abandoned threads)
    if (responseMs < 60_000 || responseMs > 7 * 24 * 60 * 60 * 1000) return;

    const prevAvg = sender.getFloat("avgResponseMs") || 0;
    const prevCount = sender.getInt("responseCount") || 0;
    const newCount = prevCount + 1;
    const newAvg = prevCount === 0
      ? responseMs
      : Math.round((prevAvg * prevCount + responseMs) / newCount);

    sender.set("avgResponseMs", newAvg);
    sender.set("responseCount", newCount);
    $app.saveNoValidate(sender);
  } catch (err) {
    console.error("response-time hook failed:", String(err));
  }
}, "messages");
