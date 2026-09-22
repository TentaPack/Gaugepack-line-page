// The service worker, two jobs.
// (1) Notifications: it shows "something new" when the mailbox taps this
//     device. The push carries no body, so there is nothing to read here;
//     the notification says the same words every time.
// (2) The pin (the trojan-page defence): the page this phone runs is kept
//     here, and an update is taken only when every new file's fingerprint
//     appears in the published list at PUBLISHED, an append-only record
//     signed by Gaugepack in a public repository. An update whose files
//     are not on that list is refused: the old version stays and the page
//     is told, so a bad page cannot be slipped to one phone without it
//     being detectable. We can be forced to publish bad code; we cannot
//     give one person different code quietly.
const PUBLISHED = "https://raw.githubusercontent.com/TentaPack/Gaugepack-line-page/main/hashes.json";
const VERSION = "efe36251a989cfa5"; // written by deploy.sh: a digest of every other page file's fingerprint
const FILES = ["index.html", "line.js", "strings.js", "qrcode.js", "line.css", "sw.js", "manifest.webmanifest", "vendor/lame.min.js", "buy.html", "buy.js", "doors.html", "doors.js", "terms.html", "privacy.html", "code.html", "code.js", "status.html", "status.js"];
const PAGES = { "/": "/index.html", "/line": "/index.html", "/make": "/index.html", "/door": "/index.html", "/d": "/index.html", "/claim": "/index.html", "/org": "/index.html", "/code": "/code.html", "/status": "/status.html", "/buy": "/buy.html", "/doors": "/doors.html", "/terms": "/terms.html", "/privacy": "/privacy.html" };
const CACHE = `line-${VERSION}`, STATE = "line-pin";
const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");

// What this phone knows about its pin, readable by the page from the Cache API.
async function state(patch) {
  const c = await caches.open(STATE); const cur = (await (await c.match("/__state"))?.json().catch(() => null)) || {};
  const next = { ...cur, ...patch, at: new Date().toISOString() };
  await c.put("/__state", new Response(JSON.stringify(next), { headers: { "content-type": "application/json" } })); return next;
}
async function tell(msg) { for (const cl of await self.clients.matchAll({ includeUncontrolled: true, type: "window" })) { try { cl.postMessage(msg); } catch {} } }
async function publishedList() { try { const r = await fetch(`${PUBLISHED}?t=${Date.now()}`, { cache: "no-store" }); if (!r.ok) return null; const j = await r.json(); return Array.isArray(j.releases) ? j : null; } catch { return null; } }
const inList = (list, file, sha) => list.releases.some((rel) => (rel.files || []).some((f) => f.file === file && f.sha256 === sha));

async function install() {
  const first = !self.registration.active; // nothing older to keep
  const fetched = [];
  for (const f of FILES) {
    const r = await fetch(`/${f}`, { cache: "reload" }); if (!r.ok) throw new Error(`could not fetch ${f}: ${r.status}`);
    const buf = await r.clone().arrayBuffer();
    fetched.push({ file: f, res: r, sha256: hex(await crypto.subtle.digest("SHA-256", buf)), bytes: buf.byteLength });
  }
  let list = null; for (let i = 0; i < 3 && !list; i++) { list = await publishedList(); if (!list) await new Promise((r) => setTimeout(r, 4000)); }
  if (list) {
    const missing = fetched.filter((f) => !inList(list, f.file, f.sha256)).map((f) => f.file);
    if (missing.length) {
      await state({ refused: { version: VERSION, missing, at: new Date().toISOString() } }); await tell({ type: "refused", version: VERSION, missing });
      throw new Error(`update refused: not on the published list: ${missing.join(", ")}`);
    }
  } else if (!first) {
    await state({ unchecked: { version: VERSION, at: new Date().toISOString() } }); await tell({ type: "unchecked", version: VERSION });
    throw new Error("update held: the published list could not be fetched; the old version stays");
  }
  const c = await caches.open(CACHE); for (const f of fetched) await c.put(`/${f.file}`, f.res);
  await state({ version: VERSION, verified: !!list, files: fetched.map(({ file, sha256, bytes }) => ({ file, sha256, bytes })), refused: null, unchecked: null });
  await self.skipWaiting();
}
self.addEventListener("install", (e) => e.waitUntil(install()));
self.addEventListener("activate", (e) => e.waitUntil((async () => {
  for (const k of await caches.keys()) if (k.startsWith("line-") && k !== CACHE && k !== STATE) await caches.delete(k);
  await self.clients.claim(); await tell({ type: "pinned", version: VERSION });
})()));
// The page's own files come from the pinned copy; everything else (the mailbox, the socket, images) goes to the network untouched.
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url); if (url.origin !== self.location.origin) return;
  const path = PAGES[url.pathname] || url.pathname; if (!FILES.includes(path.slice(1))) return;
  e.respondWith(caches.open(CACHE).then((c) => c.match(path)).then((hit) => hit || fetch(e.request)));
});

self.addEventListener("push", (e) => {
  e.waitUntil((async () => {
    try { if (self.navigator && self.navigator.setAppBadge) await self.navigator.setAppBadge(1); } catch {}
    await self.registration.showNotification("A private line", { body: "Something new. Open your code.", icon: "/icon-192.png", badge: "/badge-72.png", tag: "line", renotify: true });
  })());
});
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  e.waitUntil((async () => {
    try { if (self.navigator && self.navigator.clearAppBadge) await self.navigator.clearAppBadge(); } catch {}
    const all = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const c of all) { if ("focus" in c) return c.focus(); }
    return self.clients.openWindow("/");
  })());
});
