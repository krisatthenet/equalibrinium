/// <reference path="../pb_data/types.d.ts" />

function sendSms(to, body) {
  const accountSid = $os.getenv('TWILIO_ACCOUNT_SID');
  const authToken  = $os.getenv('TWILIO_AUTH_TOKEN');
  const from       = $os.getenv('TWILIO_FROM_NUMBER');
  if (!accountSid || !authToken || !from || !to) return;

  let n = to.trim();
  if (n.startsWith('8') && n.length === 9) n = '+370' + n.slice(1);
  else if (!n.startsWith('+')) n = '+' + n;

  try {
    const res = $http.send({
      url: `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(accountSid + ':' + authToken)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `From=${encodeURIComponent(from)}&To=${encodeURIComponent(n)}&Body=${encodeURIComponent(body)}`,
    });
    if (res.statusCode >= 400) $app.logger().error('SMS error', 'status', res.statusCode);
  } catch (err) {
    $app.logger().error('SMS send failed', 'error', err.message);
  }
}

function sendPush(userId, title, body, url) {
  const apiUrl = $os.getenv('API_INTERNAL_URL') || 'http://localhost:3001';
  const secret = $os.getenv('INTERNAL_API_SECRET');
  if (!secret) return;
  try {
    $http.send({
      url: `${apiUrl}/push/notify`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-internal-secret': secret },
      body: JSON.stringify({ userId, title, body, url }),
    });
  } catch (_) {}
}

function createNotification(userId, type, title, body, link) {
  try {
    const col = $app.findCollectionByNameOrId('notifications');
    const rec = new Record(col);
    rec.set('userId', userId);
    rec.set('type',   type);
    rec.set('title',  title);
    rec.set('body',   body || '');
    rec.set('link',   link || '');
    rec.set('read',   false);
    $app.save(rec);
  } catch (err) {
    $app.logger().error('createNotification failed', 'error', err.message);
  }
}

// New contractor joins → notify clients whose saved searches match
// No collection filter — referrals.pb.js pattern, manual collection check below
onRecordAfterCreateSuccess((e) => {
  const contractor = e.record;
  // Only process users collection records
  if (contractor.collectionName !== 'users' && contractor.collection().name !== 'users') return;
  if (contractor.get('userType') !== 'contractor') return;

  const contractorName     = contractor.get('name')       || 'A contractor';
  const contractorLocation = (contractor.get('location')  || '').toLowerCase();
  const contractorProf     = (contractor.get('profession')|| '').toLowerCase();
  const contractorBio      = (contractor.get('bio')       || '').toLowerCase();

  try {
    const searches = $app.findAllRecords('saved_searches', $dbx.exp('1=1'));

    for (const search of searches) {
      const clientId = search.get('userId');

      // Keyword: must appear in name, profession, or bio
      const kw = (search.get('keyword') || '').toLowerCase().trim();
      if (kw) {
        const contractorNameL = (contractor.get('name') || '').toLowerCase();
        if (!contractorNameL.includes(kw) && !contractorProf.includes(kw) && !contractorBio.includes(kw)) continue;
      }

      // Location: substring match
      const loc = (search.get('location') || '').toLowerCase().trim();
      if (loc && !contractorLocation.includes(loc)) continue;

      // Category: match profession against category name
      const catId = search.get('categoryId');
      if (catId) {
        try {
          const cat     = $app.findRecordById('categories', catId);
          const catName = (cat.get('name') || '').toLowerCase();
          if (!contractorProf.includes(catName) && !catName.includes(contractorProf)) continue;
        } catch (_) { continue; }
      }

      // If no criteria at all, skip — don't spam "all contractors" searches
      if (!kw && !loc && !catId) continue;

      const label = search.get('label') || 'your search';

      // DEBUG: write canary before notification
      try {
        const dbgCol = $app.findCollectionByNameOrId('notifications');
        const dbgRec = new Record(dbgCol);
        dbgRec.set('userId', 'SSA_' + contractor.id.slice(0,8));
        dbgRec.set('type',   'dispute_update');
        dbgRec.set('title',  'SSA reached: clientId=' + clientId + ' label=' + label);
        dbgRec.set('body',   '');
        dbgRec.set('link',   '');
        dbgRec.set('read',   false);
        $app.save(dbgRec);
      } catch (dbgErr) { $app.logger().error('SSA debug write failed', 'error', String(dbgErr)); }

      try {
        const client = $app.findRecordById('users', clientId);
        const phone  = client.get('phone');
        if (phone) sendSms(phone, `WorkBee: ${contractorName} matches your saved search "${label}". View them at workbee.space/explore`);
      } catch (_) {}

      sendPush(clientId, `New match: ${label}`, `${contractorName} just joined WorkBee`, '/explore');
      createNotification(clientId, 'search_alert', `New contractor matches "${label}"`, `${contractorName} is now available.`, '/explore');

      $app.logger().info('saved-search alert sent', 'clientId', clientId, 'contractor', contractorName, 'label', label);
    }
  } catch (err) {
    $app.logger().error('saved-search-alerts hook failed', 'error', err.message);
  }
});
