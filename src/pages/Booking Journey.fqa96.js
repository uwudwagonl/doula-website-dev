import { listTiers, checkAndStartBooking } from 'backend/eligibility';
import wixLocation from 'wix-location';

// Model A: client enters email (no login), clicks a step. The server records them by email, checks
// eligibility, and either sends them to the native booking or explains what to do first.

let busy = false; // in-flight guard: one booking attempt at a time (client half of the double-submit fix)

$w.onReady(async () => {
  try {
    setText($w, '#text49', 'Your care journey — enter your email, then choose a step. We confirm each one with you.');
    msg('');
    try { $w('#input1').placeholder = 'Your email'; } catch (e) {}
    try { $w('#input1').onInput(() => msg('')); } catch (e) {}
    clearBg($w, '#repeater1');

    const tiers = await listTiers();
    $w('#repeater1').data = tiers.map(t => ({ _id: t._id, t }));

    $w('#repeater1').onItemReady(($item, row) => {
      const t = row.t;
      const price = t.isFree ? 'FREE' : `${t.price} ${t.currency}`;
      const tag = t.isFreeCall ? 'CHECK-IN · ANY TIME' : `${t.trackKey.toUpperCase()} · ${price}`;
      const cta = t.isFreeCall ? '&#8250;&nbsp; Book a check-in' : (t.isFree ? '&#8250;&nbsp; Book the consultation' : '&#8250;&nbsp; Book this');

      style($item, '#box2', { backgroundColor: '#FFFFFF', borderRadius: '12px', borderColor: '#7a2f9e', borderWidth: '2px' });
      style($item, '#container2', { backgroundColor: '#FFFFFF' });
      clearBg($item, '#box2');
      clearBg($item, '#container2');

      setHtml($item, '#text47',
        `<div style="font-family:Helvetica,Arial,sans-serif">` +
        `<div style="font-size:22px;font-weight:bold;color:#111111;line-height:1.15">${t.title.trim()}</div>` +
        `<div style="font-size:11px;color:#8a7c6e;letter-spacing:.12em;margin:7px 0 11px">${tag}</div>` +
        `<div style="font-size:16px;font-weight:bold;color:#7a2f9e">${cta}</div>` +
        `</div>`);
      setText($item, '#text48', '');

      const go = () => attemptBooking(t);
      click($item, '#box2', go);
      click($item, '#container2', go);
      click($item, '#text47', go);
    });
  } catch (e) {
    console.log('gate error', e);
  }
});

async function attemptBooking(t) {
  if (busy) return;
  const email = (($w('#input1') && $w('#input1').value) || '').trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    msg('Please enter your email above first.', true);
    try { $w('#input1').focus(); } catch (e) {}
    return;
  }
  busy = true;
  let navigating = false;
  msg('Checking…');
  try {
    const res = await checkAndStartBooking(email, t._id);
    if (res && res.ok && res.bookingUrl) {
      navigating = true; // keep the guard set — a second click must not fire mid-navigation
      msg('Great — taking you to booking…');
      wixLocation.to(res.bookingUrl);
    } else {
      msg((res && res.reason) || 'That step is not available yet.', true);
    }
  } catch (e) {
    msg('Something went wrong — please try again.', true);
  } finally {
    if (!navigating) busy = false;
  }
}

function msg(text, warn) {
  try {
    const el = $w('#text50');
    if (!el || !('html' in el)) return;
    el.html = text
      ? `<div style="font-family:Helvetica,Arial,sans-serif;font-size:14px;font-weight:bold;color:${warn ? '#c0392b' : '#0a8f4f'}">${text}</div>`
      : '';
  } catch (e) {}
}

function setHtml(s, id, v) { try { const e = s(id); if (e && 'html' in e) e.html = v; } catch (x) {} }
function setText(s, id, v) { try { const e = s(id); if (e && 'text' in e) e.text = v; } catch (x) {} }
function style(s, id, p) { try { const e = s(id); if (e && e.style) { for (const k in p) { try { e.style[k] = p[k]; } catch (x) {} } } } catch (x) {} }
function clearBg(s, id) { try { const e = s(id); if (e && e.background && 'src' in e.background) e.background.src = ''; } catch (x) {} }
function click(s, id, fn) { try { const e = s(id); if (e && e.onClick) e.onClick(fn); } catch (x) {} }
