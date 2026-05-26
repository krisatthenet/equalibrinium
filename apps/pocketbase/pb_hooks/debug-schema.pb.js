/// <reference path="../pb_data/types.d.ts" />

// Temporary debug endpoint — fully simulates saved-search-alerts hook for an Electrician in Vilnius.
// DELETE after debugging.
routerAdd("GET", "/debug/alert-simulate", (c) => {
  const log = [];
  try {
    const contractorName     = 'Debug Electrician';
    const contractorLocation = 'vilnius';
    const contractorProf     = 'electrician';
    const contractorBio      = '';

    const searches = $app.findAllRecords('saved_searches', $dbx.exp('1=1'));
    log.push(`found ${searches.length} saved searches`);

    let matched = 0;
    for (const search of searches) {
      const clientId = search.get('userId');
      log.push(`checking search ${search.id} for client ${clientId}`);

      const kw = (search.get('keyword') || '').toLowerCase().trim();
      if (kw) {
        const nameMatch = contractorName.toLowerCase().includes(kw);
        const profMatch = contractorProf.includes(kw);
        const bioMatch  = contractorBio.includes(kw);
        log.push(`  kw="${kw}" nameMatch=${nameMatch} profMatch=${profMatch}`);
        if (!nameMatch && !profMatch && !bioMatch) { log.push('  → skip (kw mismatch)'); continue; }
      }

      const loc = (search.get('location') || '').toLowerCase().trim();
      if (loc) {
        const locMatch = contractorLocation.includes(loc);
        log.push(`  loc="${loc}" locMatch=${locMatch}`);
        if (!locMatch) { log.push('  → skip (loc mismatch)'); continue; }
      }

      const catId = search.get('categoryId');
      if (!kw && !loc && !catId) { log.push('  → skip (no criteria)'); continue; }

      log.push(`  → MATCH. Creating notification for ${clientId}`);
      try {
        const col = $app.findCollectionByNameOrId('notifications');
        const rec = new Record(col);
        rec.set('userId', clientId);
        rec.set('type',   'search_alert');
        rec.set('title',  `New contractor matches "${search.get('label') || 'your search'}"`);
        rec.set('body',   `${contractorName} is now available.`);
        rec.set('link',   '/explore');
        rec.set('read',   false);
        $app.save(rec);
        log.push(`  notification created: ${rec.id}`);
        matched++;
      } catch (ne) {
        log.push(`  notification FAILED: ${String(ne)}`);
      }
    }

    return c.json(200, { log, matched });
  } catch (e) {
    return c.json(500, { error: String(e), log });
  }
});
