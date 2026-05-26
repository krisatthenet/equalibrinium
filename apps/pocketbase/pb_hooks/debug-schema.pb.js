/// <reference path="../pb_data/types.d.ts" />

// Temporary debug endpoint — simulates the saved-search-alerts hook logic.
// DELETE after debugging.
routerAdd("GET", "/api/debug/alert-test", (c) => {
  try {
    // Step 1: How many saved searches?
    const searches = $app.findAllRecords('saved_searches', $dbx.exp('1=1'));
    const searchCount = searches.length;

    // Step 2: Try creating a test notification in notifications
    let notifResult = 'not attempted';
    try {
      const col = $app.findCollectionByNameOrId('notifications');
      const rec = new Record(col);
      rec.set('userId', 'debug_test');
      rec.set('type',   'search_alert');
      rec.set('title',  'Debug test notification');
      rec.set('body',   'Test');
      rec.set('link',   '/explore');
      rec.set('read',   false);
      $app.save(rec);
      notifResult = 'created: ' + rec.id;
    } catch (ne) {
      notifResult = 'failed: ' + String(ne);
    }

    // Step 3: Inspect first saved search
    let firstSearch = null;
    if (searches.length > 0) {
      const s = searches[0];
      firstSearch = {
        id:         s.id,
        userId:     s.get('userId'),
        label:      s.get('label'),
        keyword:    s.get('keyword'),
        location:   s.get('location'),
        categoryId: s.get('categoryId'),
      };
    }

    return c.json(200, { searchCount, notifResult, firstSearch });
  } catch (e) {
    return c.json(500, { error: String(e) });
  }
});
