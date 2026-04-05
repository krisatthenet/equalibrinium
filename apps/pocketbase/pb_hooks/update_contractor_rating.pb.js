onRecordAfterCreateSuccess((e) => {
  const contractorId = e.record.getString("contractorId");
  if (!contractorId) return;

  try {
    const reviews = $app.findRecordsByFilter(
      "reviews",
      `contractorId = "${contractorId}"`,
      "", 0, 0
    );

    const count = reviews.length;
    const avg = count > 0
      ? reviews.reduce((sum, r) => sum + r.getFloat("rating"), 0) / count
      : 0;

    const contractor = $app.findRecordById("users", contractorId);
    contractor.set("rating", parseFloat(avg.toFixed(2)));
    contractor.set("reviewCount", count);
    $app.save(contractor);
  } catch (err) {
    console.error("Failed to update contractor rating:", err);
  }
}, "reviews");
