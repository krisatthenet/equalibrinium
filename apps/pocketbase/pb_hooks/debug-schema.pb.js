/// <reference path="../pb_data/types.d.ts" />
// CACHEBUST=22 — trace saved-search-alerts hook logic
routerAdd("GET", "/debug/v22", (c) => {
  return c.json(200, { version: 22, hooks_loaded: true });
});

// Mirror saved-search-alerts hook but write trace to a notification for inspection
onRecordAfterCreateSuccess((e) => {
  const r = e.record;
  let colName = 'unknown';
  let trace = [];

  try { colName = r.collection().name; } catch(ex) { colName = 'ERR:' + String(ex).slice(0,30); }

  // Only trace user creates
  if (colName !== 'users') return;

  const ut = r.get('userType');
  trace.push(`colName=${colName} userType=${ut}`);

  if (ut !== 'contractor') { trace.push('not contractor, skip'); return; }

  let searchCount = -1;
  try {
    const searches = $app.findAllRecords('saved_searches', $dbx.exp('1=1'));
    searchCount = searches.length;
    trace.push(`found ${searchCount} searches`);

    for (const s of searches) {
      const kw  = (s.get('keyword')  || '').toLowerCase().trim();
      const loc = (s.get('location') || '').toLowerCase().trim();
      const cp  = (r.get('profession') || '').toLowerCase();
      const cl  = (r.get('location')   || '').toLowerCase();
      trace.push(`search=${s.id} kw="${kw}" loc="${loc}" cp="${cp}" cl="${cl}" kwMatch=${cp.includes(kw)} locMatch=${cl.includes(loc)}`);
    }
  } catch(ex) {
    trace.push('findAllRecords error: ' + String(ex).slice(0,80));
  }

  // Write trace as notification
  try {
    const col = $app.findCollectionByNameOrId('notifications');
    const rec = new Record(col);
    rec.set('userId', 'TRACE_' + r.id.slice(0,8));
    rec.set('type',   'dispute_update');
    rec.set('title',  trace.join(' | ').slice(0,200));
    rec.set('body',   '');
    rec.set('link',   '');
    rec.set('read',   false);
    $app.save(rec);
  } catch(_) {}
});
