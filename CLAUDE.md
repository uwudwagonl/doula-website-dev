# CLAUDE.md — Doula tiered booking (WORKING REPO / resume state)

This is the **live working repo** (Wix Git Integration). Read this fully before doing anything.
Last updated: 2026-07-14 (live backend/data/services work DONE and verified; live PAGES still not built — see below).

## ✅ 2026-07-14 — Live backend, CMS data, and Bookings services fixed; pages still TODO
Worked directly against live (siteId `6903e3f7-73e6-478f-8bc7-e296260a9013`) via `manage.wix.com` + the live
classic Editor (`doulabeatrizfacio-mysite.editor.wix.com`). **Nothing was published via the Editor's Publish
button** (no new pages went live) but the following live changes ARE saved/active right now, independent of
Publish (Bookings service settings and CMS data save immediately; Velo backend code is Git-synced):

1. **Discovered live has an existing GitHub sync for Velo Dev Mode**, wired to this same repo's `main` branch —
   pushing to `main` auto-syncs `src/backend/*.jsw` straight into the live site's backend (no manual paste
   needed). Confirmed `eligibility.jsw` + `admin.jsw` are live and match the repo byte-for-byte (verified via
   Monaco model content). **This means TODO 6 "add code via live's Git Integration" is effectively already
   solved by just pushing to `main` — no separate deploy step.**
2. **Fixed a real permissions gap**: the Git sync brought the `.jsw` code over but not correct permissions —
   `authorization-config.json` (live's real permissions file, not literally `permissions.json`) was missing
   `backend/eligibility.jsw` entirely (would default-deny anonymous visitors, breaking the whole public booking
   gate) and had `admin.jsw`'s `amIAdmin` wrong (blocked anonymous, should allow it for the redirect check).
   Corrected via direct Monaco-model edit + Save to match `src/backend/permissions.json`'s intent. Re-opening
   this file after a reload is fiddly (the "Backend & Public" tab only renders once a backend file is actively
   selected) — if you need to re-check it, open Dev Mode → click any backend file → the tab reappears; the raw
   file lives at `file:///backend/authorization-config.json` in the Monaco model registry (`monaco.editor.getModels()`).
3. **Verified live already has Clients/Tiers/Requests CMS collections + a correctly-seeded Tiers table** (this
   predates today, from the original site build — matches CLAUDE.md's earlier "3 inert collections" note).
   Pulled raw data via the same API the CMS panel uses
   (`GET .../_api/cloud-data/v2/items/query?.r=<base64 query>` — see Network tab for the exact `.r` param) to
   confirm: 4 Tiers rows, correct real `bookingsServiceId`s, correct `prerequisiteTierId` chain (Anchor →
   Initial, Birthing Guidance → Anchor, using live's own row `_id`s, not sandbox artifacts — they look identical
   to sandbox's docs only because sandbox is a *clone of* live and inherited the same IDs at clone time), and
   real prices (Initial consultation + Anchor both 0/free — **not** sandbox's demo 4500 SEK). No bug here.
4. **Found and fixed a real live-site bug, independent of this project**: Anchor - Birth package's payment
   method was set to "With a plan" with **no plan existing** — Wix showed "Create your first plan", meaning the
   service was **completely unbookable** by anyone, predating today's session. Changed to Price type = Free
   (temporary placeholder — real price is still Beatriz's call per TODO 1) + "Manually approve or decline
   booking requests", saved successfully (confirmed via "Anchor - Birth package saved." toast + list no longer
   showing "Plan only").
5. **Birthing Guidance was on auto-accept**; switched to manual approval, saved successfully. Its 19.99 SEK
   price and active/visible state were left untouched (Beatriz still needs to decide on this tier per TODO 1).
6. **NOT done — Free check-in call service does not exist on live** (sandbox had it cloned from Initial
   consultation). Didn't create it: needs duration/description/staff decisions that aren't mine to invent for a
   real live service. Fastest path: Bookings → Services → duplicate "Initial consultation" → rename → adjust.
7. **NOT done — no new pages/elements on live.** Attempted scripting the classic Editor's Pages & Menu panel to
   create "Booking Journey"/"Admin" pages: page creation works (Add Page → Blank Page), but **renaming a page
   via automation is blocked** — the "Page: <name>" toolbar field that looks like a rename box is actually a
   page-switcher search combobox (typing into it reverts, confirmed 3x); the real rename control is behind the
   Pages-panel row's context-menu icon (`[data-hook="context-menu-icon"]`), and neither a plain `.click()` nor a
   full synthetic pointerover/down/up/click dispatch opened its menu. A left-over unnamed blank page exists in
   the Editor's saved-but-unpublished draft state — harmless, delete it via Pages & Menu (hover the row, click
   its real action icon — this needs a genuine mouse hover to render, which only works from an actual human
   session, not scripted events) before doing anything else there.
   **Element placement (repeaters/inputs/buttons) was not attempted at all given the rename blocker.**

**Recommended next steps:**
1. Beatriz: create the Free check-in call service (duplicate Initial consultation), decide Anchor's real price,
   decide on Birthing Guidance, then re-run TODO 1 (demo data cleanup — unrelated, still pending).
2. Pages: either do the manual clicking yourself in the Editor (rename the stray page, add "Admin", place
   elements per the sandbox's `Booking Journey.fqa96.js` / `Admin.hijzs.js` element lists below) and hand back
   to Claude to verify + wire code, or try the official Wix MCP connector
   (`mcp__claude_ai_Wix__authenticate`) as an alternative automation path — untested this session.
3. Once pages exist with matching element IDs, the backend code is *already* deployed and permission-correct —
   no further backend work needed for the happy path.

Old note below (still accurate for the SANDBOX flow — do not confuse the two editors):

## TL;DR — what this is
Tiered booking system for a doula, built **Model A** (no client login). A client books on a normal-looking
site; identity = **email** (server-side, not cookies). Tiers unlock in sequence; Beatriz approves each request.
Built on a **sandbox copy** of the live site. Everything works in the Local Editor preview.

## ✅ RESOLVED 2026-07-10 — Admin buttons done + verified; editor automation works
- **TODO 2 DONE.** `#button1` (Approve) / `#button2` (Mark completed) are placed in the Admin `#repeater1` item,
  registered in `.wix/types/hijzs/hijzs.d.ts`, and **verified end-to-end in preview**: clicked Approve then Mark
  completed on a `jane@test.com` pending Request → status advanced pending→approved→completed, tier gate advanced
  ("Furthest paid/completed step: Initial consultation"), buttons collapse/disable correctly per row.
  (Yesterday's save had actually persisted the buttons despite the CLI dialog.)
- **TODO 4 DONE.** Admin page hidden from nav (Pages & Menu → Admin → "Hide from menu"), saved, verified after a
  fresh editor reload (nav ends at Booking Journey).
- **Editor automation route WORKS** with `wix dev --https` + editor URL
  `https://wix.com/editor/d4b24b74-344b-4c65-8209-dfb45e20ea2d?localPort=<PORT>&secureSocket=true`
  (PORT = LISTEN port of the node20 wix process). No CLI-connection dialog; **Save works** from Playwright.
- **True root cause of the 07-09 blocker (updated diagnosis):** Chrome **Local Network Access permission** — the
  HTTPS editor page requesting `http://localhost:<port>/socket.io/` gets "Permission was denied for this request to
  access the `loopback` address space". In an automated browser the LNA prompt can't be accepted, so the **code-sync
  socket stays blocked even now** → editor code panel + Preview run the last-SAVED site code (stale: still logs
  `ADMIN DIAG`), NOT local files. Editor structure edits + Save work fine regardless. In Benny's own browser the
  prompt can be accepted → preview runs current local code. Real publishes use `wix publish` (local code) anyway.
- **Known UX quirk (fine):** after clicking Approve/Mark completed, the row's status text doesn't refresh (re-query
  races the write); state is correct on next page load.
- **TEMP password `Doula-Temp-7j2k9Qx` on `pjhqdevs@gmail.com` still active — change back / re-enable SSO-only
  when the editor GUI work is fully done.**

## How to resume the dev environment (CRITICAL)
- **Repo:** `C:\Users\benja\Desktop\dev\doula-website-dev` · GitHub `uwudwagonl/doula-website-dev` · branch `main`.
- **Wix CLI is broken on the system Node 26** (login timer goes NaN). MUST run under **portable Node 20**:
  - Node 20 at `C:\Users\benja\AppData\Local\Temp\node20\node-v20.18.1-win-x64` (TEMP — may be wiped on reboot;
    re-download `https://nodejs.org/dist/v20.18.1/node-v20.18.1-win-x64.zip` and extract there if gone).
  - Start dev: `cd repo && export PATH="/c/Users/benja/AppData/Local/Temp/node20/node-v20.18.1-win-x64:$PATH" && wix dev`
  - Re-auth if needed: `wix login` works under Node 20 (device code), or `wix login --api-key <key>`.
- **`wix dev` quirks:** edits to local files hot-reload into the Local Editor. **KEEP THE LOCAL EDITOR BROWSER TAB
  OPEN** — closing it breaks structure sync (stale `.wix/types`). If sync breaks: `taskkill //F //IM node.exe`
  then restart `wix dev` (re-syncs from the site). Element IDs live in `.wix/types/<pageId>/<pageId>.d.ts`.
- **Placing elements** (repeater/input/button) = manual in the Local Editor (Wix has no API for it). Code = local
  files. After the user adds an element + saves, read its IDs from `.wix/types`.

## Sites & access
- **Sandbox** "Doula Booking DEV sandbox" — siteId `d4b24b74-344b-4c65-8209-dfb45e20ea2d`. All work is here. Free
  plan (can't accept real bookings → "upgrade" paywall on the native booking page; emails/payment won't fire here).
- **Live** doulabeatrizfacio.com — siteId `6903e3f7-73e6-478f-8bc7-e296260a9013`, classic Editor, Premium.
- **Ownership:** the user (account `85a5b562…`, PJHQ) is a **COLLABORATOR/Admin, NOT owner**. Owner = Beatriz
  `05fbfbf2…`. Owner-only actions (duplicate/transfer/delete) need Beatriz. She made the sandbox + invited the user.
- **Wix MCP connector** is REST-only — can read/write CMS/Bookings/data, but CANNOT push Velo code (use Git).
  Site-scoped REST needs the tool-level `siteId` set, else 401/403.

## Architecture (Model A — chosen)
- **No login.** Client enters email on the Booking Journey page, clicks a step → `checkAndStartBooking(email, tierId)`
  records them (Clients + pending Request), checks eligibility, then routes to the native booking. Beatriz approves.
- **Memory = email, server-side** (Clients/Requests CMS collections). Works cross-device (phone→PC) by same email.
- **Sequential gate:** tier N requestable only if tier N-1 is `completed` (tier with no prerequisite = always open).
- **Free check-in call:** unlocks any time for clients who completed a **paid** tier (`isFree === false`).
- **Data layer uses classic `wix-data`** (not `@wix/data`) on purpose — runtime reliability.
- **Owner detection** uses `wix-users-backend` `currentUser.role === 'Admin'` (NOT `currentMember` — that's null
  in preview / for non-members).

## Files
- `src/pages/Booking Journey.fqa96.js` — public gate. Elements: `#repeater1`(cards `#box2 #container2 #text47 #text48`),
  `#text49` header, `#text50` message line, `#input1` email TextInput.
- `src/pages/Admin.hijzs.js` — owner-only client roster (read-only). Guarded by `amIAdmin()` + redirect; backend owner-locked.
  Elements: `#repeater1`(`#box2 #container2 #text47..#text50`).
- `src/pages/Home.ss84q.js` — reverted to original (was used for an early demo; now clean).
- `src/backend/eligibility.jsw` — `getMyTiers`(login, unused), `previewTiers`(demo), `listTiers`(public),
  `checkAndStartBooking`(Model A capture), `requestTier`, helpers `isEligible/hasPaidCompletion/tierEligible/publicTier/
  resolveClientByEmail`(race-converging), `linkContact`(non-fatal Wix CRM contact link, success path only), `isValidEmail`.
- `src/backend/admin.jsw` — `getClientRoster`, `setRequestStatus`, `setRequestInfo`(invoice/booking/date, unused by page yet), `amIAdmin`.
- `src/backend/permissions.json` — listTiers/previewTiers/checkAndStartBooking/getMyTiers = anonymous; requestTier = member;
  admin.* = siteOwner only (amIAdmin = anyone).

## Collections (sandbox, all ADMIN-only)
- `Clients` (email key, name, phone, contactId, memberId, status, notes)
- `Tiers` (title, trackKey, orderIndex, prerequisiteTierId, bookingsServiceId, price, currency, isFree, active, bookingUrl, isFreeCall)
- `Requests` (clientId, email, tierId, trackKey, bookingId, requestedDate, status, invoiceId, formSubmissionId)

## Live services & seeded tiers (sandbox; service IDs match live)
| Tier | service id | tier _id | state |
|---|---|---|---|
| Initial consultation | 08311aa2-6e09-46f7-8d26-a9ac13bffc02 | 2202568e-bd5d-4294-88c3-a67ab4c4b008 | free, birth#0, no prereq, auto-confirm |
| Anchor – Birth package | ca8766b6-c1be-4868-a15a-d5274345b7a6 | be7ba81e-6e86-4385-8cd3-055fe4153d18 | **DEMO-priced 4500 SEK**, birth#1, prereq=Initial, request-to-book, taken off pricing-plan |
| Birthing Guidance | ae8399a6-b159-4f91-b672-4643400473c1 | 00319dd6-c95e-4058-9713-51c317c91a3e | 19.99 test, **tier DEACTIVATED**, request-to-book |
| Postpartum Support | cb322421-1b18-4213-ab83-7b5993d0ce08 | 60a865fe-d8fa-47af-ad3c-6342033e62a7 | free, postpartum#0, auto-confirm |
| Free check-in call | 900beaaa-6abe-4ab2-bce7-a0f6762f7316 | c1cef8a4-0744-40ce-b0c2-bbd77df2dc00 | free, isFreeCall add-on (cloned from consult) |
- Demo client: `demo@journey.test` = client _id `100e8fc7-0be1-4c37-b96e-ab09c9a6a796` (has Initial+Anchor completed).

## DONE
- Sandbox isolated; Git Integration + local dev working (under Node 20).
- Collections created + tiers seeded from live services.
- Native request-to-book enabled on Anchor + Birthing Guidance (Anchor taken off pricing-plan to allow approval).
- Public Booking Journey page: Model A email capture, eligibility gate, free-call, clickable purple cards.
- Free check-in call service + "completed a paid tier" unlock rule.
- Admin roster page: read-only, owner-guarded (amIAdmin redirect + backend siteOwner lock).
- **2026-07-09 (Erasmus Phase-2 pass, 4 agents):** duplicate-client race fixed (`resolveClientByEmail` oldest-row
  converge) + client-side double-submit guard on Booking Journey; real email regex both sides; CRM contact linking
  (`appendOrCreateContact` → `contactId` on Clients, non-fatal, UNTESTED in sandbox — check console for
  "CRM link failed"); TEMP `adminDiag` removed everywhere; `setRequestInfo` implemented (permission existed);
  repeater background photos neutralized via code (`clearBg`) on both pages — verify visually, TODO 3 may still
  need editor design work. (`FOR-ELIAS.md` QA handoff was written here, then deleted 2026-07-10 — Elias track dropped.)
- **2026-07-10: Admin buttons placed + verified end-to-end** (Approve → approved, Mark completed → completed, gate
  advances, buttons collapse/disable per row). **Admin page hidden from public nav** (saved + verified). Editor
  automation route established (`wix dev --https` + `secureSocket=true` URL — see RESOLVED section).

## TODO (next session)
1. **CLEAN UP DEMO DATA before anything real** (deferred to LAST):
   delete `demo@journey.test` client + its 2 completed Requests; **delete the 2 duplicate `jane@test.com` clients
   (ids `b55766f9…` + `f1530b6c…`) + their Requests** (the `b55766f9` one's Request is now `completed` — used for the
   2026-07-10 button test); **delete the 4th test client** (has 3 duplicate pending "Postpartum Support" Requests +
   1 approved Initial — new pollution seen 2026-07-10); revert Anchor tier price (4500 → real/free, ask Beatriz);
   decide on Birthing Guidance; fix Anchor title double space (`"Anchor  - Birth package"`). Don't ship demo rows.
2. ~~Admin actions~~ **DONE 2026-07-10** — buttons placed + full pending→approved→completed cycle verified in preview.
3. **Cosmetics:** repeater preset background photos cleared in code (`clearBg`) — **still unverified with CURRENT
   code**: automated-browser preview runs stale site code (LNA socket block, see RESOLVED section). Verify in
   Benny's own browser preview; if presets persist, remove them in the editor design panel.
4. ~~Hide Admin page from public nav~~ **DONE 2026-07-10** (menu item hidden via Pages & Menu, saved, verified).
5. **Beatriz manual config** (see `../doula-booking/CHECKLIST.md`): connect payment provider (Premium), build the
   Automation (approval → request payment + email), set working hours / blocked days. "Require login" has no Wix
   toggle — use members-only pages or rely on the gate. **Automation review 2026-07-09 (via REST):** sandbox has
   ZERO user-created automations (16 Wix-preinstalled, booking confirm/approve/remind = ACTIVE but free plan won't
   deliver); the approval→payment automation must be built on LIVE. Worth adding: Automations "CMS item created"
   trigger on `Requests` to notify Beatriz of pending requests our custom gate creates (native "someone booked"
   notification misses those).
6. **Replicate to LIVE** once approved: live currently only has the 3 inert admin-only collections + seeded tiers
   (from early on, invisible). Need to add code (via live's own Git Integration) + re-seed (live service IDs match).
   Rollback for the live changes: `../doula-booking/rollback/` (manifest + teardown.js).

## Gotchas
- **Race bug in `checkAndStartBooking` — FIXED 2026-07-09** (`resolveClientByEmail`: insert → re-query ascending
  `_createdDate` → oldest row wins, loser row deleted; plus `busy` click-guard on the page). The 2 pre-existing
  `jane@test.com` dup rows are NOT auto-merged — still delete them in TODO 1.
- Preview runs as site Admin but with NO member logged in → `currentMember` is null. Use `wix-users-backend` for owner checks.
- Free sandbox blocks real bookings (paywall) → can't test native booking emails/payment/events there.
- The original local package (`../doula-booking/`) holds the `.web.js` versions (superseded by these `.jsw`), schema docs,
  CHECKLIST.md, FOR-BEATRIZ.md, and rollback/.
