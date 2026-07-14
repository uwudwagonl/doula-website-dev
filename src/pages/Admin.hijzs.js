import { getClientRoster, amIAdmin, setRequestStatus } from 'backend/admin';
import wixLocation from 'wix-location';
import wixWindow from 'wix-window';

// Beatriz-only client roster. Backend is owner-locked; this page also guards + redirects non-admins.
// Each row = one client. Two buttons act on that client's OLDEST open request:
//   #button1  -> oldest 'pending'              -> 'approved'
//   #button2 -> oldest 'pending'|'approved'   -> 'completed'  (unlocks the next tier)

let actionable = {}; // clientId -> { approve: requestId|undefined, complete: requestId|undefined }

$w.onReady(async () => {
  // Security guard — enforced on the live site. Preview always runs as admin, so skip the redirect there.
  if (wixWindow.viewMode !== 'Preview') {
    const ok = await amIAdmin();
    if (!ok) { wixLocation.to('/'); return; }
  }

  $w('#repeater1').onItemReady(bindRow);
  // Page-level handlers fire for every repeated instance; event.context.itemId tells us which row.
  onClickSafe('#button1', (e) => act(e, 'approve', 'approved'));
  onClickSafe('#button2', (e) => act(e, 'complete', 'completed'));

  await load();
});

async function load() {
  actionable = {};
  let clients = [], err = null;
  try { clients = await getClientRoster(); } catch (e) { err = (e && e.message) || String(e); }
  if (err) console.log('roster error', err);
  const rows = clients.length ? clients.map(c => ({ _id: c.clientId, c })) : [{ _id: 'none', empty: true }];
  $w('#repeater1').data = rows;
}

function bindRow($item, row) {
  clearBg($item, '#box2'); clearBg($item, '#container2');
  style($item, '#box2', { backgroundColor: '#FFFFFF', borderRadius: '10px' });
  style($item, '#container2', { backgroundColor: '#FFFFFF' });

  if (row.empty) {
    setHtml($item, '#text47',
      `<div style="font-family:Helvetica,Arial,sans-serif;font-size:16px;color:#888">No clients yet — they'll appear here after their first booking.</div>`);
    setText($item, '#text48', ''); setText($item, '#text49', ''); setText($item, '#text50', '');
    collapse($item, '#button1'); collapse($item, '#button2');
    return;
  }

  const c = row.c;
  const furthest = c.currentTier ? c.currentTier.title.trim() : 'No completed steps yet';
  const reqs = (c.requests || []);
  const reqLine = reqs.length
    ? reqs.map(r => `${esc((r.tierTitle || '?').trim())}: <b style="color:${statusColor(r.status)}">${esc(r.status)}</b>`).join('&nbsp;&nbsp;·&nbsp;&nbsp;')
    : 'No requests yet';

  const hasName = !!(c.name && c.name.trim());
  const heading = hasName ? c.name.trim() : c.email;
  const sub = hasName ? c.email : '';
  setHtml($item, '#text47',
    `<div style="font-family:Helvetica,Arial,sans-serif">` +
    `<div style="font-size:15px;font-weight:bold;color:#111111;word-break:break-all;line-height:1.25">${esc(heading)}</div>` +
    (sub ? `<div style="font-size:12px;color:#888888;word-break:break-all">${esc(sub)}</div>` : '') + `</div>`);
  setHtml($item, '#text48',
    `<div style="font-family:Helvetica,Arial,sans-serif;font-size:13px;color:#7a2f9e;font-weight:bold">Furthest paid/completed step: ${esc(furthest)}</div>`);
  setHtml($item, '#text49',
    `<div style="font-family:Helvetica,Arial,sans-serif;font-size:13px;color:#444444">${reqLine}</div>`);
  setText($item, '#text50', '');

  // Requests arrive newest-first (backend sorts descending _createdDate); reverse to act on the OLDEST open one.
  const byOldest = [...reqs].reverse();
  const oldestPending = byOldest.find(r => r.status === 'pending');
  const oldestOpen = byOldest.find(r => r.status === 'pending' || r.status === 'approved');
  actionable[row._id] = {
    approve: oldestPending && oldestPending.requestId,
    complete: oldestOpen && oldestOpen.requestId
  };

  toggleBtn($item, '#button1', !!oldestPending, 'Approve');
  toggleBtn($item, '#button2', !!oldestOpen, 'Mark completed');
}

async function act(event, key, newStatus) {
  const itemId = event && event.context && event.context.itemId;
  const reqId = itemId && actionable[itemId] && actionable[itemId][key];
  if (!reqId) return;
  const btn = (event && event.target) || null;
  if (btn) { try { btn.disable(); btn.label = '…'; } catch (x) {} }
  try {
    await setRequestStatus({ requestId: reqId, status: newStatus });
    await load();
  } catch (e) {
    if (btn) { try { btn.label = 'Error'; btn.enable(); } catch (x) {} }
  }
}

// Client name/email are typed by the public on the Booking Journey form — escape before rendering as HTML.
function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function statusColor(s) {
  return { completed: '#0a8f4f', approved: '#0a8f4f', pending: '#d6800a', declined: '#c0392b', canceled: '#999999' }[s] || '#444444';
}

// --- safe element helpers (feature-detect so the page survives before the buttons are placed) ---
function setHtml(s, id, v) { try { const e = s(id); if (e && 'html' in e) e.html = v; } catch (x) {} }
function setText(s, id, v) { try { const e = s(id); if (e && 'text' in e) e.text = v; } catch (x) {} }
function style(s, id, p) { try { const e = s(id); if (e && e.style) { for (const k in p) { try { e.style[k] = p[k]; } catch (x) {} } } } catch (x) {} }
function clearBg(s, id) { try { const e = s(id); if (e && e.background && 'src' in e.background) e.background.src = ''; } catch (x) {} }
function collapse(s, id) { try { const e = s(id); if (e && e.collapse) e.collapse(); } catch (x) {} }
function toggleBtn(s, id, on, label) {
  try {
    const e = s(id);
    if (!e) return;
    if ('label' in e) e.label = label;
    if (e.expand) e.expand();          // keep the slot so every card's buttons line up
    if (on) { if (e.enable) e.enable(); } else { if (e.disable) e.disable(); }
  } catch (x) {}
}
function onClickSafe(id, fn) { try { const e = $w(id); if (e && e.onClick) e.onClick(fn); } catch (x) {} }
