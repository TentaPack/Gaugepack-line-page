// A private line, the page. The secret is the part of the link after the #:
// 32 random bytes, base64url, made here and never sent anywhere. The room id
// the server knows is SHA-256 of the secret; the key that seals messages is
// the secret itself (AES-GCM 256). Nothing is written to the phone: no
// storage, no cookies; close the page and it forgets. Messages come back from
// the mailbox once and are burned there on delivery.
(() => {
  const $ = (id) => document.getElementById(id);
  // The key never stays in the address bar. Browsers keep the address in
  // history and in bookmarks, and both sync to Apple's and Google's
  // accounts; a line's key sitting there is a copy of the sticker we did
  // not make. So the part after the # is read here, once, kept in this
  // tab's own storage (never synced, gone when the tab closes), and the
  // address is emptied before anything else runs. A reload restores the
  // room from that storage; nothing below ever writes a key into the
  // address again. The sticker, or "remember this line", are the ways back.
  const ROUTE = (() => {
    const path = location.pathname, search = location.search; let hash = location.hash.slice(1);
    try {
      if (hash) sessionStorage.setItem("line:route", JSON.stringify({ path, hash }));
      else { const r = JSON.parse(sessionStorage.getItem("line:route") || "null"); if (r && r.path === path) hash = r.hash; }
    } catch {}
    if (location.hash || location.search) history.replaceState(null, "", path);
    return { path, search, hash };
  })();
  const setRoute = (path, hash) => { try { if (hash) sessionStorage.setItem("line:route", JSON.stringify({ path, hash })); else sessionStorage.removeItem("line:route"); } catch {} if (location.pathname !== path || location.hash || location.search) history.replaceState(null, "", path); };
  // Words shown to people go through the strings file (Spanish by the phone's language); without it, English.
  const tr = (s, vars) => window.t ? window.t(s, vars) : (vars ? Object.entries(vars).reduce((o, [k, v]) => o.split(`{${k}}`).join(String(v)), s) : s);
  const show = (id) => { for (const s of ["make", "room", "dead", "home", "word", "pick", "closed", "door", "knock", "claim", "org"]) $(s).classList.toggle("hidden", s !== id); if (id !== "door") stopDoorPoll(); };
  let pendingWord = "";
  const b64u = (bytes) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const unb64u = (s) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (s.length % 4)) % 4)), (c) => c.charCodeAt(0));
  const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
  // This phone's tag: a random number kept on the phone so a refresh is still
  // "you" and the mailbox never hands you your own unread message back. It
  // says nothing about who you are or which lines you hold. Without storage
  // (a private window), a fresh one per page.
  const session = (() => { try { let d = localStorage.getItem("line:device"); if (!/^[A-Za-z0-9_-]{16}$/.test(d || "")) { d = b64u(crypto.getRandomValues(new Uint8Array(12))); localStorage.setItem("line:device", d); } return d; } catch { return b64u(crypto.getRandomValues(new Uint8Array(12))); } })();

  let key = null, roomId = null, secret = null, timer = null;
  const seen = new Set();

  // The key. Without a word it is the secret itself. With a word, it is
  // stretched from the secret and the word together (PBKDF2, 200,000
  // rounds), so a link seen in a text opens nothing without the word said
  // aloud. The room id is the hash of the key, so a wrong word lands in a
  // different, empty room, not an error: nothing to probe.
  let keyBytes = null, wordUsed = false;
  async function useSecret(s, word = "") {
    secret = s; wordUsed = !!word;
    const raw = unb64u(s);
    let material = raw;
    if (word) {
      const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(word.normalize("NFKC").trim().toLowerCase()), "PBKDF2", false, ["deriveBits"]);
      material = new Uint8Array(await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: raw, iterations: 200000 }, base, 256));
    }
    keyBytes = material;
    key = await crypto.subtle.importKey("raw", material, "AES-GCM", false, ["encrypt", "decrypt"]);
    roomId = hex(await crypto.subtle.digest("SHA-256", material));
  }
  async function roomIdOf(s, word = "") {
    const raw = unb64u(s); let material = raw;
    if (word) { const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(word.normalize("NFKC").trim().toLowerCase()), "PBKDF2", false, ["deriveBits"]); material = new Uint8Array(await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: raw, iterations: 200000 }, base, 256)); }
    return hex(await crypto.subtle.digest("SHA-256", material));
  }
  // The line's fingerprint: four words from the key, the same on every
  // screen that holds the same key. Said aloud once to confirm the room.
  const WORDS = "acorn amber anchor apple arrow ash atlas badge bamboo barn basil beacon bell birch bison blossom bolt bramble brass bridge brook bronze bubble bucket butter cabin cactus candle canvas canyon carbon castle cedar chalk cherry cinder clay cliff cloud clover cobalt comet copper coral cotton crane crimson crystal daisy dawn delta denim dew dragon drum dune dusk eagle ember engine falcon feather fern fig flame flint forest fossil fox frost garden garnet ginger glacier glass globe gold granite grape gravel harbor hazel heron hill honey horizon iron island ivory ivy jade jasper jungle kayak kelp kite lagoon lantern lava lemon lilac lime linen lotus lumber magnet mango maple marble meadow mesa meteor mint mirror moss nectar nickel north oak oasis ocean olive onyx opal orbit orchid otter oyster paper pearl pebble pepper petal pine planet plum poppy prism quartz quill radar raven reef ridge river robin rocket rose ruby saddle sage sail salt sand satin scarf seed shadow shell silk silver slate smoke snow sparrow spruce steam stone storm sugar summit sun swan tea thistle thunder tide timber topaz torch trail tulip tundra umber valley velvet vine violet walnut water wave willow wind wolf yarrow zephyr zinc quince keel lynx nomad ochre plume relic saffron talon ushanka vortex wren yucca zenith basalt cobble ember2 fjord grove harp indigo juniper kestrel lark mango2 nutmeg orange parrot quiver ripple sorrel tangerine upland verdant whistle xenon yellow zircon".split(/\s+/);
  async function fingerprint() { const h = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode("fingerprint:" + hex(await crypto.subtle.digest("SHA-256", keyBytes))))); return [h[0], h[1], h[2], h[3]].map((b) => WORDS[b % WORDS.length]).join(" "); }
  async function seal(text) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(text)));
    return b64u(iv) + "." + b64u(ct);
  }
  async function open(c) {
    const [iv, ct] = c.split(".");
    return new TextDecoder().decode(await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64u(iv) }, key, unb64u(ct)));
  }
  const when = (ms) => new Date(ms).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  // What you were looking at survives an app switch: the visible conversation
  // is kept for this session only, sealed with the line's key (noise on the
  // phone without it), and wiped on burn or forget. The mailbox still holds
  // nothing once delivered; this is the screen remembering, not the server.
  const shown = [];
  async function keepShown() { try { sessionStorage.setItem(`line:shown:${roomId}`, await seal(JSON.stringify(shown.slice(-200).filter((m) => !(parse(m.text).once)).map(({ text, me, t }) => ({ text, me, t }))))); } catch {} }
  async function restoreShown() {
    try { const c = sessionStorage.getItem(`line:shown:${roomId}`); if (!c) return; for (const m of JSON.parse(await open(c))) { const pm = parse(m.text); if (pm.k === "react") { applyReact(pm, m.me); shown.push({ ...m, li: null }); continue; } if (pm.k === "burn" || pm.k === "unsend") continue; const li = drawMsg(pm, m.me, m.t); shown.push({ ...m, li }); } } catch {}
  }
  function forgetShown() { try { sessionStorage.removeItem(`line:shown:${roomId}`); } catch {} }
  // The burn timer: seconds after a message is seen, it leaves the screen
  // with a flicker. Set from either side; the setting travels sealed.
  let burnAfter = 0;
  const expiries = new Map(); // li -> when it burns
  function schedule(li, seenAt) { if (!burnAfter) return; expiries.set(li, seenAt + burnAfter * 1000); }
  function applyBurn(secs, announce) {
    burnAfter = secs; $("burnafter").value = String(secs);
    for (const li of $("log").children) { if (secs) expiries.set(li, Date.now() + secs * 1000); else expiries.delete(li); }
    if (announce) $("status").textContent = secs ? tr("Messages burn {t} after they are seen, on both screens.", { t: label(secs) }) : tr("Messages stay until the line is closed.");
  }
  const label = (s) => s === 10 ? tr("10 seconds") : s === 60 ? tr("a minute") : s === 3600 ? tr("an hour") : s === 86400 ? tr("a day") : `${s} s`;
  function burnNow(li) { expiries.delete(li); li.classList.add("burning"); setTimeout(() => { li.remove(); const i = shown.findIndex((m) => m.li === li); if (i >= 0) shown.splice(i, 1); keepShown(); }, 650); }
  setInterval(() => {
    const now = Date.now();
    for (const [li, at] of expiries) {
      const left = Math.max(0, Math.ceil((at - now) / 1000)); let tag = li.querySelector(".left"); if (!tag) { tag = document.createElement("span"); tag.className = "left"; li.querySelector("time")?.appendChild(tag); }
      tag.textContent = left <= 60 ? `· ${left}s` : "";
      if (now >= at) { expiries.delete(li); li.classList.add("burning"); setTimeout(() => { li.remove(); const i = shown.findIndex((m) => m.li === li); if (i >= 0) shown.splice(i, 1); keepShown(); }, 650); }
    }
  }, 500);
  $("burnafter").addEventListener("change", async () => {
    const secs = Number($("burnafter").value) || 0;
    applyBurn(secs, true);
    const c = await seal(JSON.stringify({ k: "burn", v: secs }));
    fetch(`/api/room/${roomId}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ s: session, c, ...(deviceHash ? { d: deviceHash } : {}) }) }).catch(() => {});
  });
  const byId = new Map(); // message id -> its bubble
  let replyTo = null;     // { id, snippet }
  function actionsFor(li, m, me) {
    const bar = document.createElement("div"); bar.className = "acts hidden";
    const mk = (label, fn) => { const b = document.createElement("button"); b.type = "button"; b.className = "act"; b.textContent = label; b.onclick = (e) => { e.stopPropagation(); fn(); bar.classList.add("hidden"); }; return b; };
    for (const r of ["♥", "👍", "😂", "😮", "😢", "🔥"]) bar.appendChild(mk(r, () => { const env = { k: "react", to: m.id, v: r }; sendEnvelope(env, true); line(JSON.stringify(env), true, Date.now()); }));
    bar.appendChild(mk(tr("Reply"), () => { replyTo = { id: m.id, snippet: snippetOf(m) }; $("quote").textContent = tr("Replying to: {s}", { s: replyTo.snippet }); $("quotebar").classList.remove("hidden"); $("text").focus(); }));
    if (me) bar.appendChild(mk(tr("Take back"), () => { sendEnvelope({ k: "unsend", to: m.id }, true); burnNow(li); }));
    li.appendChild(bar);
    li.tabIndex = 0; li.setAttribute("role", "listitem");
    const toggle = () => { for (const o of document.querySelectorAll(".acts")) if (o !== bar) o.classList.add("hidden"); bar.classList.toggle("hidden"); };
    li.addEventListener("click", (e) => { if (e.target.closest("audio, video, .once, .act, a")) return; toggle(); });
    li.addEventListener("keydown", (e) => { if (e.target !== li) return; if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); if (!bar.classList.contains("hidden")) bar.querySelector(".act").focus(); } if (e.key === "Escape") bar.classList.add("hidden"); });
  }
  const snippetOf = (m) => m.k === "img" ? tr("a picture") : m.k === "audio" ? tr("a voice note") : String(m.v || "").slice(0, 60);
  function drawMsg(m, me, t) {
    const li = document.createElement("li"); if (me) li.className = "me";
    if (m.id) { li.dataset.id = m.id; byId.set(m.id, li); }
    if (m.n && !me) { const who = document.createElement("span"); who.className = "who"; who.textContent = m.n; li.appendChild(who); }
    if (m.q) { const q = document.createElement("blockquote"); q.textContent = m.q; li.appendChild(q); }
    if (m.k === "img" && m.once && !me) {
      // View once: a placeholder until tapped; full screen; burned on close.
      const b = document.createElement("span"); b.className = "once"; b.textContent = tr("Tap to view, once"); b.setAttribute("role", "button"); b.tabIndex = 0;
      const openOnce = () => { $("viewimg").src = m.v; $("viewer").classList.remove("hidden"); $("viewer").onclick = () => { $("viewer").classList.add("hidden"); $("viewimg").src = ""; burnNow(li); }; };
      b.onclick = openOnce; b.onkeydown = (e) => { if (e.key === "Enter" || e.key === " ") openOnce(); };
      li.appendChild(b);
    } else if (m.k === "img" && m.once && me) { li.appendChild(document.createTextNode(tr("A picture, view once."))); }
    else if (m.k === "img") { const img = document.createElement("img"); img.src = m.v; img.alt = tr("a picture"); li.appendChild(img); }
    else if (m.k === "video") {
      const v = document.createElement("video"); v.controls = true; v.playsInline = true; v.preload = "metadata";
      const mime = m.mime || (m.v.match(/^data:([^;,]+)/) || [])[1] || "video/mp4";
      if (v.canPlayType(mime.split(";")[0]) === "") { const n = document.createElement("span"); n.className = "hint"; n.style.display = "inline"; n.textContent = `A video this phone can't play (${mime.split(";")[0]}).`; li.appendChild(n); }
      else { try { const bin = atob(m.v.slice(m.v.indexOf(";base64,") + 8)); const bytes = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i); v.src = URL.createObjectURL(new Blob([bytes], { type: mime })); } catch { v.src = m.v; } li.appendChild(v); }
    }
    else if (m.k === "audio") {
      // The sound goes to the player as a file handle, not a data address:
      // iPhone refuses long data addresses in a player and shows "Error".
      const a = document.createElement("audio"); a.controls = true; a.preload = "metadata";
      const mime = m.mime || (m.v.match(/^data:([^;,]+)/) || [])[1] || "audio/mpeg";
      if (mime && a.canPlayType(mime) === "") { const n = document.createElement("span"); n.className = "hint"; n.style.display = "inline"; n.textContent = `A voice note this phone can't play (${mime}).`; li.appendChild(n); }
      else {
        try { const bin = atob(m.v.slice(m.v.indexOf(";base64,") + 8)); const bytes = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i); a.src = URL.createObjectURL(new Blob([bytes], { type: mime })); } catch { a.src = m.v; }
        a.onerror = () => { const n = document.createElement("span"); n.className = "hint"; n.style.display = "inline"; n.textContent = `This phone couldn't load the voice note (${mime}, code ${a.error && a.error.code || "?"}).`; a.replaceWith(n); };
        li.appendChild(a);
      }
    }
    else li.appendChild(document.createTextNode(m.v));
    const rx = document.createElement("span"); rx.className = "rx"; li.appendChild(rx);
    const tm = document.createElement("time"); tm.textContent = when(t); li.appendChild(tm);
    if (m.id) actionsFor(li, m, me);
    $("log").appendChild(li); li.scrollIntoView({ block: "end" });
    schedule(li, Date.now());
    return li;
  }
  const parse = (text) => { try { const o = JSON.parse(text); if (o && typeof o === "object" && o.k) return o; } catch {} return { k: "text", v: text }; };
  const parts = new Map(); // big messages arrive in sealed pieces; joined here, never on the server
  function applyReact(m, me) { const li = byId.get(m.to); if (!li) return; const rx = li.querySelector(".rx"); const tag = document.createElement("span"); tag.textContent = m.v; tag.className = me ? "mine" : ""; rx.appendChild(tag); }
  function line(text, me, t) {
    const m = parse(text);
    if (m.k === "burn") { applyBurn(Number(m.v) || 0, !me); return; }
    if (m.k === "react") { applyReact(m, me); shown.push({ text, me, t, li: null }); keepShown(); return; }
    if (m.k === "part") { if (me) return; const p = parts.get(m.of) || { n: m.n, got: new Map() }; parts.set(m.of, p); p.got.set(m.i, m.v); if (p.got.size === p.n) { parts.delete(m.of); let whole = ""; for (let i = 0; i < p.n; i++) whole += p.got.get(i) || ""; return line(whole, me, t); } return; }
    if (m.k === "call") { if (!me) onCallSignal(m); return; }
    if (m.k === "unsend") { const li = byId.get(m.to); if (li && !me) burnNow(li); return; }
    const li = drawMsg(m, me, t); shown.push({ text, me, t, li }); keepShown(); return li;
  }

  async function poll() {
    try {
      const r = await fetch(`/api/room/${roomId}?s=${session}`, { cache: "no-store" });
      if (r.status === 402) { stop(); show("closed"); return; }
      if (r.status === 410) { stop(); show("dead"); return; }
      handle(await r.json());
    } catch {}
  }
  // The live socket: messages arrive the moment they are sent. Polling is
  // the fallback, every second, if the socket cannot be opened.
  let ws = null;
  async function handle(data) {
    if (data.burned) { forgetShown(); stop(); show("dead"); return; }
    if (data.closed) { stop(); show("closed"); return; }
    if (typeof data.here === "number") { $("here").textContent = data.here <= 1 ? tr("Only you here") : tr("{n} here now", { n: data.here }); const can = !pc; $("calla").disabled = !can; $("callv").disabled = !can; }
    if (typeof data.until === "number") untilUi(data.until);
    if (typeof data.ticket === "string") turnTicket = data.ticket;
    const acks = [];
    for (const m of data.messages || []) {
      const k = m.c.slice(0, 24); if (m.id) acks.push(m.id); if (seen.has(k)) continue; seen.add(k);
      try { line(await open(m.c), false, m.t); } catch { line(tr("[a message this line could not open]"), false, m.t); }
    }
    // "Got it" only after what arrived is safely on this screen's sealed
    // memory, so a refresh in the next half second cannot lose it.
    await keepShown();
    if (acks.length && ws && ws.readyState === 1) { try { ws.send(JSON.stringify({ ack: acks })); } catch {} }
  }
  // How long the line is open, and the renewal code: six letters the phone
  // makes, told to the mailbox with this room's id, alive ten minutes. Typed
  // into the buy page it renews this line; then it is forgotten. A year
  // bought this way never says which card, and the card never says which room.
  function untilUi(until) {
    const box = $("until"); box.innerHTML = "";
    const days = Math.round((until - Date.now()) / 86400000);
    box.append(days > 400 ? tr("Open {d}. ", { d: new Date(until).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) }) : days > 45 ? tr("Open until {d}. ", { d: new Date(until).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) }) : days > 1 ? tr("Closes in {n} days. ", { n: days }) : tr("Closes today. "));
    const b = document.createElement("button"); b.type = "button"; b.className = "act"; b.textContent = tr("Renew"); b.onclick = renewCode; box.appendChild(b);
  }
  async function renewCode() {
    const box = $("until");
    const r = await fetch("/api/renew/code", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: roomId }) }).catch(() => null);
    const code = r && r.ok ? (await r.json().catch(() => ({}))).code : "";
    if (!r || !r.ok || !code) { box.append(r && r.status === 404 ? tr(" This line isn't in the register, so it can't be renewed here.") : tr(" Couldn't make a renewal code just now.")); return; }
    box.innerHTML = ""; box.append(tr("Renewal code ")); const c = document.createElement("strong"); c.style.color = "var(--ink)"; c.style.letterSpacing = ".2em"; c.textContent = code; box.appendChild(c); box.append(tr(", good for ten minutes. "));
    const a = document.createElement("a"); a.href = `/buy?renew=${code}`; a.target = "_blank"; a.rel = "noopener"; a.style.color = "inherit"; a.textContent = tr("Buy a year with it"); box.appendChild(a); box.append(tr(", here or on any other screen."));
  }
  function connect() {
    try {
      ws = new WebSocket(`${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/api/room/${roomId}/ws?s=${session}`);
      ws.onmessage = (e) => { try { handle(JSON.parse(e.data)); } catch {} };
      ws.onclose = (e) => { ws = null; if (e.reason === "burned") { stop(); show("dead"); return; } if (e.reason === "closed") { stop(); show("closed"); return; } if (timer !== null) setTimeout(() => { if (timer !== null && !ws) connect(); }, 1500); };
      ws.onerror = () => { try { ws.close(); } catch {} };
    } catch { ws = null; }
  }
  function start() { poll(); connect(); timer = setInterval(() => { if (document.visibilityState === "hidden") return; if (!ws || ws.readyState !== 1) poll(); }, 1000); }
  function stop() { if (typeof endCall === "function" && pc) endCall(false); if (timer) clearInterval(timer); timer = null; if (ws) { try { ws.close(); } catch {} ws = null; } }

  function busy(on) { $("sendmark").classList.toggle("hidden", !on); $("sendlabel").textContent = on ? tr("Sending") : tr("Send"); $("sendbtn").disabled = on; if (on && !$("sendmark").firstChild) $("sendmark").innerHTML = document.querySelector(".eyebrow .gp-mark").outerHTML.replace("gp-live", "gp-busy"); }
  // The offline queue: a message that cannot leave waits on the phone,
  // sealed, and goes when signal returns. Shown as "waiting for signal".
  const queue = [];
  async function flush() {
    while (queue.length) {
      const item = queue[0];
      try {
        const r = await fetch(`/api/room/${roomId}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ s: session, c: item.c, ...(deviceHash ? { d: deviceHash } : {}) }) });
        if (r.status === 402) { stop(); show("closed"); return; }
        if (r.status === 410) { stop(); show("dead"); return; }
        if (!r.ok && r.status !== 400) throw new Error("again");
        queue.shift(); if (item.li) item.li.classList.remove("waiting");
        if (r.status === 400) { $("status").textContent = tr("Too big to send; try a smaller picture."); if (item.li) burnNow(item.li); } else await report(r);
      } catch { $("status").textContent = tr("Waiting for signal."); return; }
    }
  }
  addEventListener("online", flush); setInterval(() => { if (queue.length) flush(); }, 5000);
  const myName = () => { try { return (localStorage.getItem(`line:me:${roomId}`) || "").slice(0, 24); } catch { return ""; } };
  addEventListener("error", (e) => { try { $("status").textContent = `Something broke on this page: ${e.message || "error"}`; } catch {} });
  addEventListener("unhandledrejection", (e) => { try { $("status").textContent = `Something broke on this page: ${(e.reason && (e.reason.name + ": " + e.reason.message)) || "error"}`; } catch {} });
  // The tally (the stats rule: count the network, never the line). One word
  // per thing done, sent on its own with no room, no session, no content, so
  // Gaugepack can show how big the network is. Fire and forget.
  const count = (k) => { try { fetch("/api/count", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ k }), keepalive: true }).catch(() => {}); } catch {} };
  async function sendEnvelope(env, silent = false) {
    busy(true);
    try {
      env = { id: b64u(crypto.getRandomValues(new Uint8Array(6))), ...env };
      if (["text", "img", "audio", "react", "video"].includes(env.k)) count(env.k);
      const n = myName(); if (n && env.k !== "react" && env.k !== "unsend" && env.k !== "burn") env.n = n;
      if (replyTo && (env.k === "text" || env.k === "img" || env.k === "audio")) { env.q = replyTo.snippet; replyTo = null; $("quotebar").classList.add("hidden"); }
      const text = JSON.stringify(env);
      const li = silent ? null : line(text, true, Date.now());
      if (li) li.classList.add("waiting");
      // A message bigger than the mailbox takes goes as sealed pieces, each
      // its own message; the other phone joins them. Six pieces at most.
      const PART = 600 * 1024;
      if (text.length > PART) {
        const n = Math.ceil(text.length / PART);
        if (n > 6) { $("status").textContent = tr("Too big to send, even shrunk."); if (li) burnNow(li); return; }
        for (let i = 0; i < n; i++) queue.push({ c: await seal(JSON.stringify({ k: "part", of: env.id, i, n, v: text.slice(i * PART, (i + 1) * PART) })), li: i === n - 1 ? li : null });
      } else queue.push({ c: await seal(text), li });
      await flush();
    } finally { busy(false); }
  }
  async function report(r) {
      const j = await r.json().catch(() => ({}));
      const okCount = (j.pushed || []).filter((x) => x === "ok").length, bad = (j.pushed || []).filter((x) => x !== "ok");
      $("status").textContent = j.live ? tr("Delivered live to the other side.") : okCount ? tr("Waiting for them; tapped {n} phone(s).", { n: okCount }) : bad.length ? tr("Waiting for them; the tap failed ({e}).", { e: bad.join(", ") }) : tr("Waiting for them; no phone asked to be told.");
  }
  // A picture: shrunk on the phone to at most 1024 px and a JPEG, then sealed like any message.
  $("pic").addEventListener("change", async () => {
    const f = $("pic").files?.[0]; $("pic").value = ""; if (!f) return;
    try {
      let src, w, h;
      try { const bmp = await createImageBitmap(f); src = bmp; w = bmp.width; h = bmp.height; }
      catch { const u = URL.createObjectURL(f); const img = new Image(); await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = u; }); src = img; w = img.naturalWidth; h = img.naturalHeight; URL.revokeObjectURL(u); }
      if (!w || !h) throw new Error("undecodable");
      const sc = Math.min(1, 1024 / Math.max(w, h));
      const c = document.createElement("canvas"); c.width = Math.round(w * sc); c.height = Math.round(h * sc); c.getContext("2d").drawImage(src, 0, 0, c.width, c.height);
      let q = 0.8, url = c.toDataURL("image/jpeg", q); while (url.length > 600 * 1024 && q > 0.35) { q -= 0.1; url = c.toDataURL("image/jpeg", q); }
      await sendEnvelope({ k: "img", v: url, ...($("once").checked ? { once: true } : {}) });
    } catch { $("status").textContent = tr("Couldn't read that picture. Try a JPEG, or a screenshot of it."); }
  });
  // Voice notes: hold the mic, talk, let go. Recorded by the phone in
  // whatever it can (AAC on iPhone, Opus on Android), capped at 60 seconds
  // and about 700 KB, sealed and sent like anything else. The other phone
  // plays what it can and says so when it cannot.
  let rec = null, chunks = [], recTimer = null, recStart = 0, recBytes = 0, recTick = null;
  const REC_MAX = 440 * 1024; // the blob grows ~1.8x by the time it is base64'd and sealed; 440 KB stays under the mailbox's 900 KB
  const mimeFor = () => ["audio/mp4", "audio/webm;codecs=opus", "audio/webm", "audio/ogg"].find((m) => window.MediaRecorder && MediaRecorder.isTypeSupported(m)) || "";
  async function recStartFn() {
    if (!window.MediaRecorder) { $("status").textContent = tr("This phone's browser can't record voice notes."); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = mimeFor();
      try { rec = new MediaRecorder(stream, mime ? { mimeType: mime, audioBitsPerSecond: 32000 } : { audioBitsPerSecond: 32000 }); } catch { rec = new MediaRecorder(stream); }
      chunks = []; recBytes = 0;
      rec.ondataavailable = (ev) => { if (ev.data.size) { chunks.push(ev.data); recBytes += ev.data.size; if (recBytes > REC_MAX && rec && rec.state === "recording") rec.stop(); } };
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop()); clearInterval(recTick); clearTimeout(recTimer);
        const secs = Math.round((Date.now() - recStart) / 1000);
        const blob = new Blob(chunks, { type: rec.mimeType || mime || "audio/webm" }); rec = null; $("mic").classList.remove("rec"); $("mic").title = tr("Tap to record"); $("recbar").classList.add("hidden");
        if (blob.size < 1500) { $("status").textContent = tr("Tap the mic, talk, tap it again to send."); return; }
        $("status").textContent = tr("Sealing the voice note…");
        try {
          // Every phone plays MP3; iPhone can't play Android's Opus and the
          // reverse is shaky, so the sending phone converts before sealing
          // (a vendored encoder, on the phone; nothing leaves unsealed).
          let out = blob; try { out = await toMp3(blob); } catch (e) { console.warn("mp3", e); }
          const url = await new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(out); });
          await sendEnvelope({ k: "audio", v: url, mime: out.type, s: secs });
        } catch (e) { count("voice_failed"); $("status").textContent = `Couldn't send that voice note (${e && e.name || "unknown"}).`; }
      };
      rec.onerror = (ev) => { count("voice_failed"); $("status").textContent = `The recorder stopped (${ev && ev.error && ev.error.name || "error"}).`; try { rec.stop(); } catch {} };
      try { rec.start(500); } catch { rec.start(); }
      recStart = Date.now(); $("mic").classList.add("rec"); $("mic").title = tr("Recording; tap to send"); $("recbar").classList.remove("hidden");
      const tick = () => { const sec = Math.round((Date.now() - recStart) / 1000); $("recbar").textContent = tr("Recording {m}:{s}. Tap the pink square to send.", { m: Math.floor(sec / 60), s: String(sec % 60).padStart(2, "0") }); };
      tick(); recTick = setInterval(tick, 500);
      recTimer = setTimeout(() => { if (rec && rec.state === "recording") rec.stop(); }, 60000);
    } catch (e) { $("status").textContent = e && e.name === "NotAllowedError" ? tr("The phone didn't allow the microphone. Allow it in the browser's site settings and try again.") : `Couldn't start recording (${e && e.name || "unknown"}).`; rec = null; }
  }
  async function toMp3(blob) {
    if (!window.lamejs) await new Promise((res, rej) => { const sc = document.createElement("script"); sc.src = "/vendor/lame.min.js"; sc.integrity = "sha384-xuasJXVcyv3hZq0eYpelEkBC8l4yufatZXDsKuyCU2rqfhDCb+ftuE/mSfZAteiK"; sc.onload = res; sc.onerror = rej; document.head.appendChild(sc); });
    const AC = window.AudioContext || window.webkitAudioContext; const ctx = new AC();
    const decoded = await new Promise((res, rej) => { blob.arrayBuffer().then((ab) => { const p = ctx.decodeAudioData(ab, res, rej); if (p && p.then) p.then(res, rej); }).catch(rej); });
    const rate = 22050, off = new OfflineAudioContext(1, Math.ceil(decoded.duration * rate), rate);
    const src = off.createBufferSource(); src.buffer = decoded; src.connect(off.destination); src.start();
    const mono = (await off.startRendering()).getChannelData(0); try { ctx.close(); } catch {}
    const pcm = new Int16Array(mono.length); for (let i = 0; i < mono.length; i++) { const v = Math.max(-1, Math.min(1, mono[i])); pcm[i] = v < 0 ? v * 32768 : v * 32767; }
    const enc = new lamejs.Mp3Encoder(1, rate, 32), parts = [];
    for (let i = 0; i < pcm.length; i += 1152) { const d = enc.encodeBuffer(pcm.subarray(i, i + 1152)); if (d.length) parts.push(new Uint8Array(d.buffer, d.byteOffset, d.length)); }
    const end = enc.flush(); if (end.length) parts.push(new Uint8Array(end.buffer, end.byteOffset, end.length));
    return new Blob(parts, { type: "audio/mpeg" });
  }
  function recStopFn() { if (rec && rec.state === "recording") rec.stop(); }
  $("mic").addEventListener("click", (e) => { e.preventDefault(); if (rec) recStopFn(); else recStartFn(); });
  $("mic").addEventListener("contextmenu", (e) => e.preventDefault());
  $("mic").addEventListener("contextmenu", (e) => e.preventDefault());

  $("send").addEventListener("submit", async (e) => {
    e.preventDefault();
    const text = $("text").value.trim(); if (!text) return;
    $("text").value = "";
    await sendEnvelope({ k: "text", v: text });
  });
  // Short videos: picked from the phone, shrunk on the phone (480 wide, 15
  // seconds at most, played through a canvas into the recorder), sealed and
  // sent in pieces. iPhone records MP4, Android WebM; the other side says
  // so when it cannot play one.
  $("vid").addEventListener("change", async () => {
    const f = $("vid").files?.[0]; $("vid").value = ""; if (!f) return;
    try {
      let out = f;
      if (f.size > 500 * 1024 || !/^video\/(mp4|quicktime)$/.test(f.type)) out = await shrinkVideo(f);
      if (out.size > 2600 * 1024) { count("video_failed"); $("status").textContent = tr("That video is too big even shrunk; try a shorter one."); return; }
      $("status").textContent = tr("Sealing the video…");
      const url = await new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(out); });
      await sendEnvelope({ k: "video", v: url, mime: out.type });
    } catch (e) { count("video_failed"); $("status").textContent = `Couldn't send that video (${e && e.name || "error"}).`; }
  });
  async function shrinkVideo(file) {
    const v = document.createElement("video"); v.muted = true; v.playsInline = true; v.src = URL.createObjectURL(file);
    await new Promise((res, rej) => { v.onloadedmetadata = res; v.onerror = () => rej(new Error("undecodable")); });
    const sc = Math.min(1, 480 / Math.max(v.videoWidth, v.videoHeight)); const c = document.createElement("canvas"); c.width = Math.round(v.videoWidth * sc) & ~1; c.height = Math.round(v.videoHeight * sc) & ~1; const ctx = c.getContext("2d");
    const stream = c.captureStream(24);
    try { const AC = window.AudioContext || window.webkitAudioContext; const ac = new AC(); const srcNode = ac.createMediaElementSource(v); const dest = ac.createMediaStreamDestination(); srcNode.connect(dest); for (const t of dest.stream.getAudioTracks()) stream.addTrack(t); v.muted = false; } catch {}
    const mime = ["video/mp4;codecs=avc1.42E01E,mp4a.40.2", "video/mp4", "video/webm;codecs=vp8,opus", "video/webm"].find((m) => MediaRecorder.isTypeSupported(m)) || "";
    const rec = new MediaRecorder(stream, mime ? { mimeType: mime, videoBitsPerSecond: 350000, audioBitsPerSecond: 32000 } : undefined); const chunks = [];
    rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
    const done = new Promise((res) => { rec.onstop = res; });
    const limit = Math.min(v.duration || 15, 15);
    let raf; const draw = () => { ctx.drawImage(v, 0, 0, c.width, c.height); $("status").textContent = `Shrinking the video… ${Math.min(100, Math.round((v.currentTime / limit) * 100))}%`; if (v.currentTime >= limit || v.ended) { if (rec.state === "recording") rec.stop(); v.pause(); return; } raf = requestAnimationFrame(draw); };
    v.currentTime = 0; try { await v.play(); } catch { v.muted = true; await v.play(); } rec.start(500); draw();
    await done; cancelAnimationFrame(raf); URL.revokeObjectURL(v.src);
    return new Blob(chunks, { type: rec.mimeType || mime || "video/webm" });
  }

  // Calls: phone to phone, encrypted between them by design; the mailbox
  // carries only the sealed handshake, like any message, and never the
  // call. Both must be here. No relay yet: a network that blocks direct
  // connections fails to connect and says so.
  let pc = null, localStream = null, callVideo = false, callTimer = null, callStart = 0, callRole = "", ringTimer = null;
  // The relay: the phone asks for an hour of TURN credentials as a call
  // starts and uses them if the mailbox has any; otherwise STUN only, and a
  // network that blocks direct connections says so.
  const STUN = { iceServers: [{ urls: "stun:stun.cloudflare.com:3478" }] };
  let relayOn = false, turnTicket = "";
  async function iceConfig() { try { const d = await (await fetch(`/api/turn?ticket=${encodeURIComponent(turnTicket)}`, { cache: "no-store" })).json(); relayOn = !!d.relay; if (Array.isArray(d.iceServers) && d.iceServers.length) return { iceServers: d.iceServers }; } catch {} relayOn = false; return STUN; }
  const callSignal = (v, extra = {}) => sendEnvelope({ k: "call", v, x: Date.now() + 90000, ...extra }, true);
  async function gathered(p) { if (p.iceGatheringState === "complete") return; await new Promise((res) => { const t = setTimeout(res, relayOn ? 4500 : 2500); p.onicegatheringstatechange = () => { if (p.iceGatheringState === "complete") { clearTimeout(t); res(); } }; }); }
  async function media(video) {
    const st = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true }, video: video ? { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } } : false });
    localStream = st; $("local").srcObject = video ? st : null; return st;
  }
  // Did this call go through the relay? The chosen candidate pair says; a count, never an address.
  async function relayed(p) { try { const st = await p.getStats(); let pair = null; for (const v of st.values()) if (v.type === "transport" && v.selectedCandidatePairId) pair = st.get(v.selectedCandidatePairId); if (!pair) for (const v of st.values()) if (v.type === "candidate-pair" && (v.selected || v.state === "succeeded")) { pair = v; break; } if (!pair) return false; const l = st.get(pair.localCandidateId), r = st.get(pair.remoteCandidateId); return !!((l && l.candidateType === "relay") || (r && r.candidateType === "relay")); } catch { return false; } }
  function newPc(ice) {
    const p = new RTCPeerConnection(ice || STUN);
    p.ontrack = (e) => { $("remote").srcObject = e.streams[0]; if (!callVideo) { $("remote").srcObject = null; const a = $("remoteaudio") || Object.assign(document.createElement("audio"), { id: "remoteaudio", autoplay: true }); a.srcObject = e.streams[0]; if (!a.isConnected) $("callpanel").appendChild(a); } };
    p.onconnectionstatechange = () => {
      if (p.connectionState === "connected") { callStart = Date.now(); $("callstate").textContent = tr("Connected {t}", { t: "0:00" }); if (callRole === "caller") relayed(p).then((yes) => { if (yes) count("call_relayed"); }); clearInterval(callTimer); callTimer = setInterval(() => { const sec = Math.round((Date.now() - callStart) / 1000); $("callstate").textContent = tr("Connected {t}", { t: `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}` }); }, 1000); if (callRole === "caller") count(callVideo ? "vcall" : "call"); }
      if (p.connectionState === "failed") { if (callRole === "caller") count("call_failed"); $("callstate").textContent = relayOn ? tr("Couldn't connect these two phones, even through the relay.") : tr("Couldn't connect these two networks directly (no relay yet)."); setTimeout(endCall, 2500); }
      if (p.connectionState === "disconnected" || p.connectionState === "closed") { if (pc === p) endCall(false); }
    };
    return p;
  }
  function showCall(video) { callVideo = video; $("callpanel").classList.toggle("voice", !video); $("camoff").classList.toggle("hidden", !video); $("share").classList.toggle("hidden", !(video && navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia)); $("callpanel").classList.remove("hidden"); $("calla").disabled = true; $("callv").disabled = true; $("incoming").classList.add("hidden"); }
  async function startCall(video) {
    if (pc) return; callRole = "caller";
    try { showCall(video); $("callstate").textContent = tr("Calling…"); const [st, ice] = await Promise.all([media(video), iceConfig()]); pc = newPc(ice); for (const t of st.getTracks()) pc.addTrack(t, st); const offer = await pc.createOffer(); await pc.setLocalDescription(offer); await gathered(pc); await callSignal("offer", { sdp: pc.localDescription.sdp, video }); const here = parseInt($("here").textContent) || 1; $("callstate").textContent = here >= 2 ? tr("Ringing…") : tr("Ringing… they're not here; their phone gets a tap and this rings for 90 seconds."); ringTimer = setTimeout(() => { if (pc && !callStart) { $("callstate").textContent = tr("No answer."); setTimeout(() => endCall(true), 1500); } }, 90000); }
    catch (e) { $("callstate").textContent = e && e.name === "NotAllowedError" ? tr("The phone didn't allow the camera or microphone.") : `Couldn't start the call (${e && e.name || "error"}).`; setTimeout(endCall, 2500); }
  }
  let pendingOffer = null;
  function onCallSignal(m) {
    if (m.x && Date.now() > m.x + 60000) return; // stale: an offer from minutes ago
    if (m.v === "offer") { if (pc) { callSignal("busy"); return; } pendingOffer = m; $("inctext").textContent = m.video ? tr("Incoming video call") : tr("Incoming call"); $("incoming").classList.remove("hidden"); try { navigator.vibrate && navigator.vibrate([200, 100, 200]); } catch {} return; }
    if (m.v === "answer" && pc && callRole === "caller") { pc.setRemoteDescription({ type: "answer", sdp: m.sdp }).catch(() => {}); $("callstate").textContent = tr("Connecting…"); return; }
    if (m.v === "decline") { $("callstate").textContent = tr("They declined."); setTimeout(endCall, 1500); return; }
    if (m.v === "busy") { $("callstate").textContent = tr("They're on another call."); setTimeout(endCall, 1500); return; }
    if (m.v === "hangup") { if (pendingOffer) { pendingOffer = null; $("incoming").classList.add("hidden"); } if (pc) { $("callstate").textContent = tr("They hung up."); setTimeout(() => endCall(false), 1200); } return; }
  }
  $("accept").onclick = async () => {
    const m = pendingOffer; pendingOffer = null; if (!m || pc) return; callRole = "callee";
    try { showCall(!!m.video); $("callstate").textContent = tr("Connecting…"); const [st, ice] = await Promise.all([media(!!m.video), iceConfig()]); pc = newPc(ice); for (const t of st.getTracks()) pc.addTrack(t, st); await pc.setRemoteDescription({ type: "offer", sdp: m.sdp }); const ans = await pc.createAnswer(); await pc.setLocalDescription(ans); await gathered(pc); await callSignal("answer", { sdp: pc.localDescription.sdp }); }
    catch (e) { $("callstate").textContent = e && e.name === "NotAllowedError" ? tr("The phone didn't allow the camera or microphone.") : `Couldn't answer (${e && e.name || "error"}).`; callSignal("decline"); setTimeout(endCall, 2500); }
  };
  $("decline").onclick = () => { pendingOffer = null; $("incoming").classList.add("hidden"); callSignal("decline"); };
  function endCall(tell = true) {
    if (tell && (pc || callRole)) callSignal("hangup");
    if (pc) { try { pc.close(); } catch {} } pc = null; callRole = ""; callStart = 0; clearTimeout(ringTimer);
    if (shareStream) { for (const t of shareStream.getTracks()) t.stop(); shareStream = null; $("share").textContent = tr("Share screen"); }
    if (localStream) { for (const t of localStream.getTracks()) t.stop(); localStream = null; }
    clearInterval(callTimer); $("callpanel").classList.add("hidden"); $("remote").srcObject = null; $("local").srcObject = null; const a = $("remoteaudio"); if (a) a.remove();
    $("mute").textContent = tr("Mute"); $("camoff").textContent = tr("Camera off");
    $("calla").disabled = false; $("callv").disabled = false;
  }
  $("hangup").onclick = () => endCall(true);
  $("mute").onclick = () => { if (!localStream) return; const on = localStream.getAudioTracks().some((t) => t.enabled); for (const t of localStream.getAudioTracks()) t.enabled = !on; $("mute").textContent = on ? tr("Unmute") : tr("Mute"); };
  $("camoff").onclick = () => { if (!localStream) return; const on = localStream.getVideoTracks().some((t) => t.enabled); for (const t of localStream.getVideoTracks()) t.enabled = !on; $("camoff").textContent = on ? tr("Camera on") : tr("Camera off"); };
  // Screen share, on a video call, from anything that can (laptops, some
  // Androids; iPhone cannot yet): the screen replaces the camera on the
  // same encrypted connection, and comes back when sharing stops.
  let shareStream = null;
  async function shareScreen() {
    if (!pc || !localStream) return;
    if (shareStream) { stopShare(); return; }
    try {
      shareStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      const track = shareStream.getVideoTracks()[0]; const sender = pc.getSenders().find((x) => x.track && x.track.kind === "video");
      if (sender) await sender.replaceTrack(track); $("local").srcObject = shareStream; $("share").textContent = tr("Stop sharing"); count("share");
      track.onended = stopShare;
    } catch (e) { if (!(e && e.name === "NotAllowedError")) $("callstate").textContent = tr("This device can't share its screen."); shareStream = null; }
  }
  async function stopShare() {
    if (!shareStream) return; for (const t of shareStream.getTracks()) t.stop(); shareStream = null; $("share").textContent = tr("Share screen");
    if (pc && localStream) { const cam = localStream.getVideoTracks()[0]; const sender = pc.getSenders().find((x) => x.track && x.track.kind === "video" || (x.track === null)); if (sender && cam) await sender.replaceTrack(cam); $("local").srcObject = localStream; }
  }
  $("share").onclick = shareScreen;
  $("calla").onclick = () => startCall(false);
  $("callv").onclick = () => startCall(true);
  addEventListener("pagehide", () => { if (pc) endCall(true); });

  async function burnLine(why = "") { count("burn"); if (why === "panic") count("panic"); setRoute(location.pathname, ""); try { await fetch(`/api/room/${roomId}`, { method: "DELETE" }); } catch {} { const m = remAll(); delete m[roomId]; remSave(m); } forgetShown(); stop(); show("dead"); }
  $("burn").addEventListener("click", async () => {
    if (!confirm(tr("Burn the line? Every message goes and both codes become paper. There is no undo."))) return;
    await burnLine();
  });
  // Panic burn, opt in per line on this phone: a hard shake (three jolts in
  // two seconds), or the mark held for two seconds, burns the line with no
  // question asked. iPhone asks once for motion permission when it is turned on.
  const PANIC = () => `line:panic:${roomId}`;
  let jolts = [], holdTimer = null;
  function onMotion(e) { const a = e.accelerationIncludingGravity || e.acceleration; if (!a) return; const g = Math.sqrt((a.x || 0) ** 2 + (a.y || 0) ** 2 + (a.z || 0) ** 2); if (g < 28) return; const now = Date.now(); jolts = jolts.filter((t) => now - t < 2000); jolts.push(now); if (jolts.length >= 3 && roomId && timer !== null) { jolts = []; burnLine("panic"); } }
  function panicUi() {
    let on = false; try { on = localStorage.getItem(PANIC()) === "1"; } catch {}
    $("panic").checked = on; if (on) addEventListener("devicemotion", onMotion); else removeEventListener("devicemotion", onMotion);
    $("panic").onchange = async () => {
      const want = $("panic").checked;
      if (want && typeof DeviceMotionEvent !== "undefined" && typeof DeviceMotionEvent.requestPermission === "function") { try { const p = await DeviceMotionEvent.requestPermission(); if (p !== "granted") $("status").textContent = tr("Motion wasn't allowed, so only holding the mark will burn; allow it in Settings to shake."); } catch {} }
      try { if (want) localStorage.setItem(PANIC(), "1"); else localStorage.removeItem(PANIC()); } catch {}
      panicUi(); $("status").textContent = want ? tr("Panic burn is on for this line on this phone.") : tr("Panic burn is off.");
    };
    const startHold = () => { if (!$("panic").checked) return; clearTimeout(holdTimer); holdTimer = setTimeout(() => { holdTimer = null; burnLine("panic"); }, 2000); };
    const endHold = () => { if (holdTimer) { clearTimeout(holdTimer); holdTimer = null; } };
    $("rem").onpointerdown = startHold; $("rem").onpointerup = endHold; $("rem").onpointerleave = endHold; $("rem").onpointercancel = endHold;
  }

  // Making a line: a fresh secret, two codes of the same link, the link itself.
  // Gaugepack's code: dots and finders in the signal pink, the mark in the
  // centre at error correction H, on white so it scans from a black page.
  function drawQr(el, url) {
    const q = qrcode(0, "H"); q.addData(url); q.make();
    const n = q.getModuleCount(), quiet = 2, size = 400, cell = size / (n + quiet * 2);
    const inF = (r, c) => (r < 7 && c < 7) || (r < 7 && c >= n - 7) || (r >= n - 7 && c < 7);
    let dots = "", f = ""; const rad = (cell * 0.46).toFixed(2);
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
      if (!q.isDark(r, c)) continue;
      const x = (c + quiet) * cell, y = (r + quiet) * cell;
      if (inF(r, c)) f += `<rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${cell.toFixed(2)}" height="${cell.toFixed(2)}"/>`;
      else dots += `<circle cx="${(x + cell / 2).toFixed(2)}" cy="${(y + cell / 2).toFixed(2)}" r="${rad}"/>`;
    }
    const plate = size * 0.22, px = (size - plate) / 2, m = plate * 0.72, mx = (size - m) / 2;
    const G = `<g fill="none" stroke="#16141D" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12A9 9 0 0 0 18.894 6.215" stroke-opacity=".28"/><path d="M18.894 6.215A9 9 0 1 0 21 12"/><path d="M12 12L21 12"/></g><circle cx="21" cy="12" r="1.7" fill="#E0447C"/>`;
    el.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}"><rect width="${size}" height="${size}" fill="#fff"/><g fill="#E0447C">${dots}</g><g fill="#E0447C">${f}</g><rect x="${px}" y="${px}" width="${plate}" height="${plate}" rx="${plate / 2}" fill="#fff"/><svg x="${mx}" y="${mx}" width="${m}" height="${m}" viewBox="0 0 24 24">${G}</svg></svg>`;
  }
  // Doors: the line with one side fixed. The owner's phone holds a P-256
  // private key and a read key; the sticker holds the public key. A knock is
  // the visitor's fresh line secret sealed to that public key (ECDH, then
  // AES-GCM), so the door itself can open nothing.
  const DOORS = "line:doors";
  const doorsAll = () => { try { return JSON.parse(localStorage.getItem(DOORS) || "{}"); } catch { return {}; } };
  const doorsSave = (m) => { try { localStorage.setItem(DOORS, JSON.stringify(m)); } catch {} };
  const ECDH = { name: "ECDH", namedCurve: "P-256" };
  async function sealTo(pubRaw, text) {
    const eph = await crypto.subtle.generateKey(ECDH, true, ["deriveBits"]); const pub = await crypto.subtle.importKey("raw", pubRaw, ECDH, false, []);
    const bits = await crypto.subtle.deriveBits({ name: "ECDH", public: pub }, eph.privateKey, 256);
    const k = await crypto.subtle.importKey("raw", await crypto.subtle.digest("SHA-256", bits), "AES-GCM", false, ["encrypt"]);
    const iv = crypto.getRandomValues(new Uint8Array(12)); const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, k, new TextEncoder().encode(text));
    return `${b64u(new Uint8Array(await crypto.subtle.exportKey("raw", eph.publicKey)))}.${b64u(iv)}.${b64u(new Uint8Array(ct))}`;
  }
  async function openWith(privJwk, c) {
    const [e, i, t] = c.split("."); const priv = await crypto.subtle.importKey("jwk", privJwk, ECDH, false, ["deriveBits"]); const pub = await crypto.subtle.importKey("raw", unb64u(e), ECDH, false, []);
    const bits = await crypto.subtle.deriveBits({ name: "ECDH", public: pub }, priv, 256);
    const k = await crypto.subtle.importKey("raw", await crypto.subtle.digest("SHA-256", bits), "AES-GCM", false, ["decrypt"]);
    return new TextDecoder().decode(await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64u(i) }, k, unb64u(t)));
  }
  async function makeDoor(token) {
    const kp = await crypto.subtle.generateKey(ECDH, true, ["deriveBits"]);
    const pubRaw = new Uint8Array(await crypto.subtle.exportKey("raw", kp.publicKey)); const priv = await crypto.subtle.exportKey("jwk", kp.privateKey);
    const id = hex(await crypto.subtle.digest("SHA-256", pubRaw)); const read = b64u(crypto.getRandomValues(new Uint8Array(32)));
    const readHash = hex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(read)));
    const r = await fetch("/api/doors", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token, id, pub: b64u(pubRaw), readHash }) });
    if (!r.ok) { $("doornote").textContent = r.status === 403 ? "That door link was already used or is older than an hour. Make a new one from the maker." : "Couldn't make the door."; show("door"); return; }
    const made = await r.json().catch(() => ({}));
    const m = doorsAll(); m[id] = { priv, pub: b64u(pubRaw), read, label: "", made: Date.now(), until: made.until || 0, sold: !!made.sold }; doorsSave(m);
    setRoute("/door", ""); showDoor(id);
    if (made.sold) $("doornote").textContent = `This phone is the door now; only it can answer. Print the code on your card, your window, your table. Open while the subscription is paid (through ${new Date(made.until).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })} so far); manage it from the receipt Stripe emailed you.`;
  }
  let doorTimer = null, doorId = null;
  function stopDoorPoll() { if (doorTimer) clearInterval(doorTimer); doorTimer = null; }
  async function showDoor(id) {
    const m = doorsAll(); const d = m[id]; if (!d) { show("home"); return; } doorId = id;
    const ids = Object.keys(m); const pick = $("doorpick"); pick.innerHTML = ""; pick.classList.toggle("hidden", ids.length < 2);
    for (const other of ids) { const b = document.createElement("button"); b.type = "button"; b.className = "btn ghost small"; b.textContent = m[other].label || `Door ${other.slice(0, 6)}`; b.onclick = () => showDoor(other); pick.appendChild(b); }
    const url = `${location.origin}/d?q#${d.pub}`, link = `${location.origin}/d?l#${d.pub}`;
    drawQr($("doorqr"), url); $("doorlabel").textContent = d.label || "Your door";
    $("doorcopy").onclick = async () => { try { await navigator.clipboard.writeText(link); $("doorcopy").textContent = tr("Copied"); setTimeout(() => ($("doorcopy").textContent = tr("Copy the link")), 1500); } catch {} };
    $("doordl").onclick = async () => { const svg = $("doorqr").innerHTML; const img = new Image(); await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg); }); const c = document.createElement("canvas"); c.width = 900; c.height = 900; const g = c.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, 900, 900); g.drawImage(img, 50, 50, 800, 800); const a = document.createElement("a"); a.download = "door.png"; a.href = c.toDataURL("image/png"); a.click(); };
    $("doorbell").onclick = async () => {
      try {
        if (!("serviceWorker" in navigator) || !("PushManager" in window)) throw new Error("no push");
        const reg = await navigator.serviceWorker.register("/sw.js"); const perm = await Notification.requestPermission(); if (perm !== "granted") { $("doornote").textContent = tr("Notifications were refused by the phone."); return; }
        const { key: k } = await (await fetch("/api/vapid")).json();
        const sub = (await reg.pushManager.getSubscription()) || (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: unb64u(k) }));
        const dh = hex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(sub.endpoint)));
        const r = await fetch(`/api/door/${id}/push`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ read: d.read, d: dh, sub: sub.toJSON() }) });
        $("doornote").textContent = r.ok ? tr("This phone gets a tap when someone knocks.") : "Couldn't keep this phone's address.";
      } catch (e) { $("doornote").textContent = /standalone|home/i.test(String(e)) ? "Add this page to your Home Screen first." : "Couldn't turn that on here."; }
    };
    show("door"); await pollDoor(); stopDoorPoll(); doorTimer = setInterval(() => { if (document.visibilityState !== "hidden") pollDoor(); }, 6000);
  }
  async function pollDoor() {
    const d = doorsAll()[doorId]; if (!d) return;
    let r; try { r = await fetch(`/api/door/${doorId}/read`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ read: d.read }) }); } catch { return; }
    if (r.status === 402) { $("knocks").innerHTML = ""; $("knocks").appendChild(Object.assign(document.createElement("p"), { className: "hint", textContent: tr("This door has closed. Reopen it from the maker.") })); return; }
    if (!r.ok) return;
    const { knocks } = await r.json(); const box = $("knocks"); box.innerHTML = "";
    if (!knocks.length) { box.appendChild(Object.assign(document.createElement("p"), { className: "hint", textContent: tr("Nobody waiting. This phone checks every few seconds while this page is open, and gets a tap when it isn't.") })); return; }
    for (const k of knocks) {
      const row = document.createElement("div"); row.className = "lrow";
      const left = document.createElement("div"); left.className = "lmeta"; const t = document.createElement("strong"); t.textContent = tr("Someone knocked"); left.appendChild(t);
      const ago = Math.max(0, Math.round((Date.now() - k.t) / 60000)); const h = document.createElement("span"); h.className = "hint"; h.textContent = ago < 1 ? tr("just now") : tr("{n} min ago", { n: ago }); left.appendChild(h); row.appendChild(left);
      const b = document.createElement("button"); b.type = "button"; b.className = "btn small"; b.textContent = tr("Answer");
      b.onclick = async () => {
        try {
          const sec = await openWith(d.priv, k.c); if (!/^[A-Za-z0-9_-]{43}$/.test(sec)) throw new Error("bad");
          await useSecret(sec); pendingWord = "";
          // The room this phone opened from the sealed knock is the one the door extends to its own date; a knock that named another room extends nothing.
          await fetch(`/api/door/${doorId}/ack`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ read: d.read, ids: [k.id], rooms: { [k.id]: roomId } }) });
          { const m = remAll(); m[roomId] = { secret: sec, word: "" }; remSave(m); if (!namesGet()[roomId]) nameSet(tr("Knock, {d}", { d: new Date(k.t).toLocaleDateString(undefined, { month: "short", day: "numeric" }) }), "#E0447C"); }
          setRoute("/line", sec); enterRoom();
        } catch { h.textContent = "Couldn't open this knock (it may have been sealed to another door)."; }
      };
      row.appendChild(b); box.appendChild(row);
    }
  }
  async function knock(pubB64) {
    $("knockgo").disabled = true; $("knockgo").textContent = tr("Making the line…");
    try {
      const pubRaw = unb64u(pubB64); const id = hex(await crypto.subtle.digest("SHA-256", pubRaw));
      const info = await (await fetch(`/api/door/${id}/info`)).json().catch(() => ({})); if (!info.open) { $("knocknote").textContent = tr("This door is closed."); $("knockgo").textContent = tr("Closed"); return; }
      const sec = b64u(crypto.getRandomValues(new Uint8Array(32))); await useSecret(sec); pendingWord = "";
      const c = await sealTo(pubRaw, sec);
      const r = await fetch(`/api/door/${id}/knock`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ room: roomId, c }) });
      if (!r.ok) { $("knocknote").textContent = r.status === 402 ? tr("This door is closed.") : r.status === 429 ? tr("Too many knocks from here; try in a minute.") : tr("Couldn't knock."); $("knockgo").disabled = false; $("knockgo").textContent = tr("Open a line"); return; }
      count("line");
      setRoute("/line", sec); enterRoom(); $("status").textContent = tr("Knocked. Their phone has been tapped; when they answer, you're both here.");
    } catch (e) { $("knocknote").textContent = `Couldn't open a line here (${e && e.name}: ${e && e.message}).`; $("knockgo").disabled = false; $("knockgo").textContent = tr("Open a line"); }
  }

  // The owner's register: every line made, its label, made and open-until
  // dates; close, give a year, burn. Room ids only; nothing about use.
  async function loadLines() {
    const r = await fetch("/api/lines").catch(() => null); if (!r || !r.ok) return;
    const { lines } = await r.json(); const box = $("lines-owner"); box.innerHTML = ""; $("linesbox").classList.remove("hidden");
    $("linescount").textContent = `${lines.length} line${lines.length === 1 ? "" : "s"} in the register`;
    const day = (t) => new Date(t).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
    for (const l of lines) {
      const open = l.until > Date.now();
      const row = document.createElement("div"); row.className = "lrow";
      const left = document.createElement("div"); left.className = "lmeta";
      const name = document.createElement("strong"); name.textContent = l.label || `Line ${l.id.slice(0, 6)}`; left.appendChild(name);
      const meta = document.createElement("span"); meta.className = "hint"; meta.textContent = `${l.id.slice(0, 8)} · made ${day(l.made)} · ${open ? `open until ${day(l.until)}` : "closed"}`; left.appendChild(meta);
      row.appendChild(left);
      const acts = document.createElement("div"); acts.className = "lacts";
      const act = (label, fn, cls = "btn ghost small") => { const b = document.createElement("button"); b.type = "button"; b.className = cls; b.textContent = label; b.onclick = fn; acts.appendChild(b); };
      const post = async (body) => { await fetch(`/api/lines/${l.id}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }); loadLines(); };
      if (open) act("Close", () => { if (confirm(`Close "${name.textContent}"? Both phones see "this line has closed" and nothing is delivered until it is reopened.`)) post({ action: "close" }); });
      act(open ? "Add a year" : "Reopen, a year", () => post({ action: "year" }));
      act("Rename", () => { const v = prompt("Label for this line (kept in the register only):", l.label || ""); if (v !== null) post({ label: v }); });
      act("Burn", async () => { if (!confirm(`Burn "${name.textContent}"? Every message goes and both codes become paper. No undo.`)) return; await fetch(`/api/lines/${l.id}`, { method: "DELETE" }); loadLines(); });
      row.appendChild(acts); box.appendChild(row);
    }
  }
  // N codes of the same link (a pair, or a pack of 6, 12, 30): drawn here,
  // downloaded as one sheet, each a sticker.
  function drawCodes(url, n) {
    const box = $("codes"); box.innerHTML = ""; box.style.gridTemplateColumns = n > 2 ? "repeat(auto-fill, minmax(140px, 1fr))" : "1fr 1fr";
    for (let i = 0; i < n; i++) { const f = document.createElement("figure"); const d = document.createElement("div"); f.appendChild(d); const c = document.createElement("figcaption"); c.textContent = n === 2 ? (i ? tr("Theirs") : tr("Yours")) : tr("{i} of {n}", { i: i + 1, n }); f.appendChild(c); box.appendChild(f); drawQr(d, url); }
  }
  async function downloadCodes(n) {
    const svg = $("codes").querySelector("figure div").innerHTML;
    const img = new Image(); await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg); });
    const cols = n <= 2 ? n : n <= 6 ? 3 : n <= 12 ? 4 : 6, rows = Math.ceil(n / cols), cell = 800, pad = 50;
    const c = document.createElement("canvas"); c.width = cols * cell + pad * 2; c.height = rows * cell + pad * 2; const g = c.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height);
    for (let i = 0; i < n; i++) g.drawImage(img, pad + (i % cols) * cell, pad + Math.floor(i / cols) * cell, cell, cell);
    const a = document.createElement("a"); a.download = n === 2 ? "private-line.png" : `private-line-pack-of-${n}.png`; a.href = c.toDataURL("image/png"); a.click();
  }
  // Making a line. From the maker: registered a year under the label typed.
  // From a claim (paid, or sold by hand): already registered by the claim,
  // and the maker-only fields stay hidden.
  function showOrgLink(link, name) { $("orgformnote").innerHTML = ""; const a = document.createElement("a"); a.href = link; a.textContent = link; a.style.color = "inherit"; $("orgformnote").append(`${name}: send this link to them privately; it is their account (open a month; add time below). `, a); }
  async function loadOrgs() {
    const r = await fetch("/api/lines/orgs").catch(() => null); if (!r || !r.ok) return;
    const { orgs } = await r.json(); const box = $("orgs-owner"); box.innerHTML = ""; $("orgsbox").classList.remove("hidden");
    const day = (t) => new Date(t).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
    for (const o of orgs) {
      const row = document.createElement("div"); row.className = "lrow";
      const left = document.createElement("div"); left.className = "lmeta"; const name = document.createElement("strong"); name.textContent = o.name; left.appendChild(name);
      const meta = document.createElement("span"); meta.className = "hint"; meta.textContent = `${o.lines} line${o.lines === 1 ? "" : "s"} · ${o.open ? `open until ${day(o.until)}` : "closed"}`; left.appendChild(meta); row.appendChild(left);
      const acts = document.createElement("div"); acts.className = "lacts";
      const act = (label, fn) => { const b = document.createElement("button"); b.type = "button"; b.className = "btn ghost small"; b.textContent = label; b.onclick = fn; acts.appendChild(b); };
      const post = async (body) => { const rr = await fetch(`/api/lines/orgs/${o.id}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }); loadOrgs(); return rr.json().catch(() => ({})); };
      act("Add a month", () => post({ action: "month" })); act("Add a year", () => post({ action: "year" }));
      if (o.open) act("Close", () => { if (confirm(`Close "${o.name}" and every line under it?`)) post({ action: "close" }); });
      act("Fresh link", async () => { if (!confirm(`Make a fresh link for "${o.name}"? The old one stops working.`)) return; const d = await post({ action: "link" }); showOrgLink(d.link, o.name); });
      row.appendChild(acts); box.appendChild(row);
    }
  }
  async function makeLine(claimed = null) {
    const s = claimed ? claimed.secret : b64u(crypto.getRandomValues(new Uint8Array(32)));
    const word = claimed ? claimed.word : ($("mkword").value || "").trim();
    const n = (claimed && claimed.n) || 2;
    await useSecret(s, word); pendingWord = word;
    const url = `${location.origin}/line?q#${s}${word ? ".w" : ""}`;       // printed: a scan
    const link = `${location.origin}/line?l#${s}${word ? ".w" : ""}`;      // copied: a link
    count("line");
    for (const el of [$("mklabel"), $("mkword"), $("remake"), document.querySelector('label[for="mkword"]')]) el.classList.toggle("hidden", !!claimed);
    if (claimed && claimed.org) {
      const reg = await fetch("/api/org/lines", { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${orgTok()}` }, body: JSON.stringify({ id: roomId, label: claimed.label, n }) }).catch(() => null);
      $("regnote").innerHTML = ""; $("regnote").append(reg && reg.ok ? `"${claimed.label}": ${n} stickers, open while the account is. Print them now; this page is the only place the key exists. ` : "Couldn't register this line under the account; it will not open. ");
      const back = document.createElement("a"); back.href = "/org"; back.textContent = "Back to your lines"; back.style.color = "inherit"; back.onclick = (e) => { e.preventDefault(); history.replaceState(null, "", "/org"); orgPage(); }; $("regnote").appendChild(back);
    }
    else if (claimed) { $("regnote").textContent = tr("Yours for a year, until {d}. Print {c} (or download the sheet) before you leave this page; they are the only keys.", { d: new Date(claimed.until).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }), c: n === 2 ? tr("these two codes") : tr("these {n} codes", { n }) }); }
    else {
      // Into the register: the room id (a hash), a year, the label typed here. Never the key.
      const reg = await fetch("/api/lines", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: roomId, label: ($("mklabel").value || "").trim() }) }).catch(() => null);
      $("regnote").textContent = reg && reg.ok ? "Registered: open for a year from today." : "Not registered (sign in first); this line will not open.";
      $("mklabel").value = ""; loadLines();
    }
    $("fp").textContent = await fingerprint();
    $("wordnote").textContent = word ? `This line needs the word "${word}" as well as the code. Send the link by text, say the word by voice; either alone opens nothing.` : tr("No word: anyone holding a code is in the line.");
    drawCodes(url, n);
    $("decoy").disabled = false; $("decoy").classList.remove("hidden"); $("decoynote").textContent = tr("A third sticker that looks the same. Scanning it burns the line and opens an empty room. For when someone makes you hand over your sticker.");
    $("decoy").onclick = async () => {
      $("decoy").disabled = true;
      const s2 = b64u(crypto.getRandomValues(new Uint8Array(32))); const y = await roomIdOf(s2, "");
      const r = await fetch(`/api/room/${roomId}/decoy`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ decoy: y }) }).catch(() => null);
      if (!r || !r.ok) { $("decoynote").textContent = tr("Couldn't add a decoy just now."); $("decoy").disabled = false; return; }
      const f = document.createElement("figure"); const d = document.createElement("div"); f.appendChild(d); const c = document.createElement("figcaption"); c.textContent = tr("Decoy"); f.appendChild(c); $("codes").appendChild(f); drawQr(d, `${location.origin}/line?q#${s2}`);
      $("decoynote").textContent = tr("The decoy is the code marked Decoy; it looks like the others once cut. Hand it over and the line is gone before they see anything.");
      $("decoy").classList.add("hidden");
    };
    $("copy").onclick = async () => { try { await navigator.clipboard.writeText(link); $("copy").textContent = tr("Copied"); setTimeout(() => ($("copy").textContent = tr("Copy the link")), 1500); } catch {} };
    $("enter").onclick = () => { setRoute("/line", `${s}${word ? ".w" : ""}`); enterRoom(); };
    $("dl").onclick = (e) => { e.preventDefault(); downloadCodes(n); };
    show("make");
  }
  // The organiser's pack: the account's link is its key (a signed token
  // after the #, kept on this device so /org opens by itself). The page
  // lists the account's lines, makes and reissues them (the key is made
  // here and shown once as stickers), closes and reopens, and shows the
  // month's bill. The account never holds a key.
  const orgTok = () => { try { return localStorage.getItem("line:org") || ""; } catch { return ""; } };
  const orgApi = async (path, body) => fetch(path, { method: body ? "POST" : "GET", headers: { "content-type": "application/json", authorization: `Bearer ${orgTok()}` }, body: body ? JSON.stringify(body) : undefined });
  async function orgPage(tok) {
    if (tok) { try { localStorage.setItem("line:org", tok); } catch {} setRoute("/org", ""); }
    if (!orgTok()) { show("home"); $("fpline").textContent = "This organisation's link is missing or expired. Ask Gaugepack for a fresh one."; return; }
    const r = await orgApi("/api/org").catch(() => null); if (!r || !r.ok) { show("home"); $("fpline").textContent = r && r.status === 401 ? "This organisation's link no longer works. Ask Gaugepack for a fresh one." : "Couldn't reach the mailbox."; return; }
    const o = await r.json(); show("org");
    $("orgname").textContent = `${o.name}: your lines.`;
    const day = (t) => new Date(t).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
    $("orgstate").textContent = o.open ? `Account open until ${day(o.until)}. ${o.lines.filter((l) => l.open).length} of ${o.lines.length} lines open.` : "This account has closed; its lines are closed with it. Ask Gaugepack to reopen it.";
    $("orggo").disabled = !o.open;
    const box = $("orglines"); box.innerHTML = "";
    if (!o.lines.length) box.appendChild(Object.assign(document.createElement("p"), { className: "hint", textContent: "No lines yet. Make one above." }));
    for (const l of o.lines) {
      const row = document.createElement("div"); row.className = "lrow";
      const left = document.createElement("div"); left.className = "lmeta"; const name = document.createElement("strong"); name.textContent = l.label || `Line ${l.id.slice(0, 6)}`; left.appendChild(name);
      const meta = document.createElement("span"); meta.className = "hint"; meta.textContent = `made ${day(l.made)} · ${l.open ? `open until ${day(l.until)}` : "closed"}`; left.appendChild(meta); row.appendChild(left);
      const acts = document.createElement("div"); acts.className = "lacts";
      const act = (label, fn) => { const b = document.createElement("button"); b.type = "button"; b.className = "btn ghost small"; b.textContent = label; b.onclick = fn; acts.appendChild(b); };
      const post = async (body) => { await orgApi(`/api/org/lines/${l.id}`, body); orgPage(); };
      if (l.open) act("Close", () => { if (confirm(`Close "${name.textContent}"? Every phone in it sees "this line has closed" until you reopen it.`)) post({ action: "close" }); }); else if (o.open) act("Reopen", () => post({ action: "reopen" }));
      act("Rename", () => { const v = prompt("Label for this line:", l.label || ""); if (v !== null) post({ label: v }); });
      act("Reissue", async () => { if (!confirm(`Reissue "${name.textContent}"? The old stickers become paper and every message in it goes; you print new ones now.`)) return; const rr = await orgApi(`/api/org/lines/${l.id}`, { action: "reissue" }); if (rr.ok) makeLine({ secret: b64u(crypto.getRandomValues(new Uint8Array(32))), word: "", n: l.n || 2, org: true, label: l.label }); });
      act("Burn", async () => { if (!confirm(`Burn "${name.textContent}"? Every message goes and its stickers become paper. No undo.`)) return; await orgApi(`/api/org/lines/${l.id}`, { action: "burn" }); orgPage(); });
      row.appendChild(acts); box.appendChild(row);
    }
    const bill = $("orgbill"); bill.innerHTML = "";
    for (const m of o.months) { const row = document.createElement("div"); row.className = "lrow"; const left = document.createElement("div"); left.className = "lmeta"; const t = document.createElement("strong"); t.textContent = new Date(m.month + "-02").toLocaleDateString(undefined, { year: "numeric", month: "long" }); left.appendChild(t); const h = document.createElement("span"); h.className = "hint"; h.textContent = `${m.lines} line${m.lines === 1 ? "" : "s"}${m.billed > m.lines ? ` (billed as the minimum, ${m.billed})` : ""}`; left.appendChild(h); row.appendChild(left); const amt = document.createElement("strong"); amt.textContent = `$${(m.cents / 100).toFixed(2)}`; row.appendChild(amt); bill.appendChild(row); }
    $("orgmake").onsubmit = (e) => { e.preventDefault(); const label = ($("orglabel").value || "").trim(); if (!label) { $("orgnote").textContent = "Give the line a label first."; return; } $("orgnote").textContent = ""; makeLine({ secret: b64u(crypto.getRandomValues(new Uint8Array(32))), word: ($("orgword").value || "").trim(), n: Number($("orgn").value) || 2, org: true, label }); $("orglabel").value = ""; $("orgword").value = ""; };
  }
  // The claim page, after paying (or from a token sold by hand): the phone
  // makes the line, tells the mailbox only the room id with the token, and
  // the room opens for a year. The word, if any, is part of the key, so it
  // is asked for before the room id exists.
  async function claimPage(s) {
    const sid = new URLSearchParams(ROUTE.search).get("s"); let token = /^[a-f0-9]{32}$/.test(s) ? s : "", n = 2;
    if (sid) {
      const r = await fetch("/api/claim/start", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ session: sid }) }).catch(() => null);
      const d = r ? await r.json().catch(() => ({})) : {};
      if (d.done) { show("claim"); $("claimtitle").textContent = tr("Renewed."); $("claimlead").textContent = tr("That line is open for another year. Open it on your phone as always; the date under the fingerprint words has moved."); $("claimrow").classList.add("hidden"); return; }
      if (d.kind && d.kind.startsWith("door")) { setRoute("/door", d.token); location.replace("/door"); return; }
      if (!d.token) { show("claim"); $("claimtitle").textContent = d.error === "claimed" ? tr("Already claimed.") : d.error === "unpaid" ? tr("Not paid yet.") : tr("Couldn't find that payment."); $("claimlead").textContent = d.error === "claimed" ? "This payment already made its line. If that wasn't you, write to support@gaugepack.com from the receipt's email." : d.error === "unpaid" ? "Stripe hasn't confirmed the payment. Wait a moment and reload this page." : "Reload this page in a moment; if it still fails, write to support@gaugepack.com with your receipt."; $("claimrow").classList.add("hidden"); return; }
      token = d.token; n = d.n || 2; setRoute("/claim", token);
    }
    if (!token) { show("home"); return; }
    show("claim");
    $("claimgo").onclick = async () => {
      $("claimgo").disabled = true; $("claimgo").textContent = tr("Making it…"); $("claimnote").textContent = "";
      try {
        const secret = b64u(crypto.getRandomValues(new Uint8Array(32))), word = ($("clword").value || "").trim();
        const id = await roomIdOf(secret, word);
        const r = await fetch("/api/claim", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token, id }) });
        const d = await r.json().catch(() => ({}));
        if (!r.ok) { $("claimnote").textContent = r.status === 403 ? tr("This claim was already used, or is older than a week.") : tr("Couldn't open the line; try again in a moment."); $("claimgo").disabled = false; $("claimgo").textContent = tr("Make the line"); return; }
        setRoute("/claim", ""); await makeLine({ secret, word, n: d.n || n, until: d.until });
      } catch (e) { $("claimnote").textContent = `Couldn't make the line here (${e && e.name}).`; $("claimgo").disabled = false; $("claimgo").textContent = tr("Make the line"); }
    };
  }
  // Notifications: a bodyless tap from the mailbox when a message is waiting
  // and this device is not connected. The device is known to the line only as
  // the hash of its push address; that hash rides on each message sent so the
  // sender's own device is never tapped for its own words.
  let deviceHash = null;
  async function pushSetup() {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    try {
      const reg = await navigator.serviceWorker.register("/sw.js");
      const existing = await reg.pushManager.getSubscription();
      const note = (t) => { $("bellnote").textContent = t; };
      const bellOn = (on) => { $("bell").setAttribute("aria-pressed", on ? "true" : "false"); $("bell").title = on ? tr("Notifications are on for this line; tap to turn off") : tr("Tell me when there's something new"); $("bell").setAttribute("aria-label", $("bell").title); };
      let on = false;
      if (existing) { deviceHash = hex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(existing.endpoint))); const r = await fetch(`/api/room/${roomId}/push`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ d: deviceHash, sub: existing.toJSON() }) }); on = r.ok; if (on) note(tr("Notifications are on for this line. Only \"something new\", never the words.")); }
      bellOn(on); $("bell").classList.remove("hidden"); $("notif").classList.remove("hidden");
      $("bell").onclick = async () => {
        if (on) { // off: this phone's address leaves the line
          try { if (deviceHash) await fetch(`/api/room/${roomId}/push`, { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ d: deviceHash }) }); } catch {}
          on = false; bellOn(false); note(tr("Notifications are off for this line.")); return;
        }
        try {
          const perm = await Notification.requestPermission(); if (perm !== "granted") { note(tr("Notifications were refused by the phone.")); return; }
          const { key: k } = await (await fetch("/api/vapid")).json();
          const sub = (await reg.pushManager.getSubscription()) || (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: unb64u(k) }));
          deviceHash = hex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(sub.endpoint)));
          const saved = await fetch(`/api/room/${roomId}/push`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ d: deviceHash, sub: sub.toJSON() }) });
          if (!saved.ok) { note("The line couldn't keep this phone's address."); return; }
          on = true; bellOn(true); note(tr("Notifications are on for this line. Only \"something new\", never the words."));
        } catch (e) { note(/standalone|home/i.test(String(e)) ? tr("Add this page to your Home Screen first, then tap the bell.") : tr("Couldn't turn them on here.")); }
      };
      if (navigator.clearAppBadge) navigator.clearAppBadge().catch(() => {});
    } catch {}
  }
  function meUi() { $("me").value = myName(); $("me").onchange = () => { try { localStorage.setItem(`line:me:${roomId}`, $("me").value.slice(0, 24)); } catch {} }; $("quoteclose").onclick = () => { replyTo = null; $("quotebar").classList.add("hidden"); }; }
  function enterRoom() { $("calla").disabled = false; $("callv").disabled = false; try { if (!localStorage.getItem(`line:in:${roomId}`)) { localStorage.setItem(`line:in:${roomId}`, "1"); count("open"); } } catch {} meUi(); panicUi(); show("room"); $("log").innerHTML = ""; seen.clear(); shown.length = 0; restoreShown().then(() => { start(); }); $("text").focus(); pushSetup(); remberUi(); nameUi(); fingerprint().then((f) => { $("roomfp").textContent = f; }); }

  // Remembering, opt in: the key kept on this phone only, so the icon opens
  // the line by itself. Off by default; the sticker is the key.
  const REMS = "line:remembered:all";
  const remAll = () => { try { const m = JSON.parse(localStorage.getItem(REMS) || "{}"); const old = localStorage.getItem("line:remembered"); if (old && !Object.values(m).some((r) => r.secret === old)) { m["old"] = { secret: old, word: localStorage.getItem("line:remembered:word") || "" }; localStorage.setItem(REMS, JSON.stringify(m)); localStorage.removeItem("line:remembered"); localStorage.removeItem("line:remembered:word"); } return m; } catch { return {}; } };
  const remSave = (m) => { try { localStorage.setItem(REMS, JSON.stringify(m)); } catch {} };
  const remembered = () => { const m = remAll(); const r = m[roomId]; return r ? r.secret : ""; };
  function remberUi() {
    const on = remembered() === secret;
    $("rem").setAttribute("aria-pressed", on ? "true" : "false"); $("rem").title = on ? tr("Remembered on this phone; tap to forget") : tr("Remember this line on this phone"); $("rem").setAttribute("aria-label", $("rem").title);
    $("remmark").classList.toggle("gp-live", on);
    $("rem").onclick = () => { const m = remAll(); if (on) { delete m[roomId]; forgetShown(); } else m[roomId] = { secret, word: pendingWord || "" }; remSave(m); remberUi(); };
  }
  // The line's name and colour, kept on this phone only, never sent.
  const NAMES = "line:names";
  const namesGet = () => { try { return JSON.parse(localStorage.getItem(NAMES) || "{}"); } catch { return {}; } };
  const nameSet = (name, colour) => { try { const n = namesGet(); n[roomId] = { name, colour }; localStorage.setItem(NAMES, JSON.stringify(n)); } catch {} };
  function nameUi() {
    const n = namesGet()[roomId] || {};
    $("lname").value = n.name || ""; $("lcolour").value = n.colour || "#E0447C";
    document.documentElement.style.setProperty("--accent", n.colour || "#E0447C");
    document.title = n.name ? `${n.name} · ${tr("A private line")}` : tr("A private line");
    $("lname").onchange = () => nameSet($("lname").value.slice(0, 24), $("lcolour").value);
    $("lcolour").oninput = () => { nameSet($("lname").value.slice(0, 24), $("lcolour").value); document.documentElement.style.setProperty("--accent", $("lcolour").value); };
  }
  // Route: a secret in the hash enters that line (asking for the word when
  // the link says one is needed); a remembered one enters by itself; none
  // shows the front door.
  (async () => {
    let s = ROUTE.hash, needsWord = false;
    if (s.endsWith(".w")) { s = s.slice(0, -2); needsWord = true; }
    if (ROUTE.path === "/door") { const doors = doorsAll(); if (/^[a-f0-9]{32}$/.test(s)) { setRoute("/door", ""); await makeDoor(s); return; } const ids = Object.keys(doors); if (ids.length) { await showDoor(ids[0]); return; } show("home"); return; }
    if (ROUTE.path === "/claim") { await claimPage(s); return; }
    if (ROUTE.path === "/org") { await orgPage(/^[a-f0-9]{12}\.\d+\.[0-9a-f]{64}$/.test(s) ? s : ""); return; }
    if (ROUTE.path === "/d") { if (!/^[A-Za-z0-9_-]{86,90}$/.test(s)) { show("home"); return; } try { const nav = performance.getEntriesByType("navigation")[0]; if (!nav || nav.type === "navigate") count(ROUTE.search === "?q" ? "scan" : "link"); } catch {} show("knock"); $("knockgo").onclick = () => knock(s); return; }
    if (ROUTE.path !== "/make" && !/^[A-Za-z0-9_-]{43}$/.test(s)) {
      const m = remAll(); const ids = Object.keys(m);
      if (ids.length === 1) { const r = m[ids[0]]; s = r.secret; needsWord = false; setRoute("/line", `${s}${r.word ? ".w" : ""}`); if (r.word) { await useSecret(s, r.word); pendingWord = r.word; enterRoom(); return; } }
      else if (ids.length > 1) {
        // Several lines on this phone: pick one by its name and colour.
        const names = namesGet(); const list = $("lines"); list.innerHTML = "";
        for (const id of ids) { const n = names[id] || {}; const b = document.createElement("button"); b.type = "button"; b.className = "btn ghost"; b.style.borderColor = n.colour || "var(--line)"; b.style.color = n.colour || "var(--ink)"; b.textContent = n.name || "A line"; b.onclick = async () => { const r = m[id]; setRoute("/line", `${r.secret}${r.word ? ".w" : ""}`); await useSecret(r.secret, r.word || ""); pendingWord = r.word || ""; count("return"); enterRoom(); }; list.appendChild(b); }
        if (Object.keys(doorsAll()).length) { const b = document.createElement("button"); b.type = "button"; b.className = "btn ghost"; b.textContent = "Your door"; b.onclick = () => { setRoute("/door", ""); showDoor(Object.keys(doorsAll())[0]); }; list.appendChild(b); }
        show("pick"); return;
      }
    }
    if (ROUTE.path !== "/make" && /^[A-Za-z0-9_-]{43}$/.test(s)) {
      // Arrived by a code or a link (not a reload): one anonymous "scan" for the tally.
      try { const nav = performance.getEntriesByType("navigation")[0]; if (!nav || nav.type === "navigate") count(ROUTE.search === "?q" ? "scan" : "link"); } catch {}
      if (needsWord) {
        show("word");
        $("wordform").onsubmit = async (e) => { e.preventDefault(); const w = $("word").value; if (!w.trim()) return; $("wordgo").disabled = true; $("wordgo").textContent = "Opening"; await useSecret(s, w); pendingWord = w; enterRoom(); };
        return;
      }
      await useSecret(s); enterRoom(); return;
    }
    show("home");
    // The page checks itself: the hash of line.js as your phone received it,
    // beside the hash the server says it is serving. Published at launch so
    // the two can be compared with a third, independent, copy.
    try {
      const mine = await (await fetch("/line.js", { cache: "no-store" })).arrayBuffer();
      const h = hex(await crypto.subtle.digest("SHA-256", mine));
      const server = await (await fetch("/api/fingerprint")).json();
      const pin = await pinState();
      const pinText = pin && pin.refused ? " " + PIN_WORDS.refused(pin.refused) : pin && pin.version ? ` Pinned on this phone as version ${pin.version}${pin.verified ? ", checked against the published list" : ", not yet checked against the published list"}.` : " Not pinned on this phone yet.";
      $("fpline").innerHTML = `This page's sealing code: <code>${h.slice(0, 16)}…</code>${server.sha256 === h ? " matches what the server says it serves." : " <strong>does not match</strong> what the server says it serves."}` + pinText.replace(/</g, "&lt;");
    } catch { $("fpline").textContent = ""; }
    // Private until launch: /make#<key> unlocks the maker when the key matches the Worker's secret.
    if (ROUTE.path === "/make") {
      // Signed in by cookie, or (until the account exists) by the key after the #.
      const r = await fetch("/api/make", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ key: s }) });
      const d = await r.json().catch(() => ({}));
      if (r.ok) { $("newwrap").classList.remove("hidden"); setRoute("/make", ""); }
      else if (d.account) {
        $("signin").classList.remove("hidden");
        $("signin").onsubmit = async (e) => {
          e.preventDefault(); $("sigo").disabled = true; $("sinote").textContent = "";
          const lr = await fetch("/api/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ user: $("siuser").value, pass: $("sipass").value }) });
          $("sigo").disabled = false;
          if (lr.ok) { $("signin").classList.add("hidden"); $("newwrap").classList.remove("hidden"); $("sipass").value = ""; }
          else $("sinote").textContent = lr.status === 429 ? "Too many tries. Wait a minute." : "That isn't it.";
        };
      }
      $("signout").onclick = async () => { await fetch("/api/logout", { method: "POST" }); location.reload(); };
      $("doortoken").onclick = async () => {
        const tr = await fetch("/api/lines/door-token", { method: "POST" }); if (!tr.ok) { $("doortokennote").textContent = "Sign in first."; return; }
        const { token } = await tr.json(); const url = `${location.origin}/door#${token}`;
        $("doortokennote").innerHTML = ""; const a = document.createElement("a"); a.href = url; a.textContent = url; a.style.color = "inherit"; $("doortokennote").append("Open this on the phone that will answer the door (one use, one hour): ", a); drawQr($("doortokenqr") || $("doortokennote").appendChild(Object.assign(document.createElement("div"), { id: "doortokenqr", style: "max-width:220px;margin-top:8px" })), url);
      };
      $("claimtoken").onclick = async () => {
        const tr = await fetch("/api/lines/claim-token", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ kind: $("claimkind").value }) }); if (!tr.ok) { $("claimtokennote").textContent = "Sign in first."; return; }
        const { token } = await tr.json(); const url = `${location.origin}/claim#${token}`;
        $("claimtokennote").innerHTML = ""; const a = document.createElement("a"); a.href = url; a.textContent = url; a.style.color = "inherit"; $("claimtokennote").append("Sold by hand: the buyer opens this on their phone and it makes their line, open a year (one use, seven days): ", a); drawQr($("claimtokenqr") || $("claimtokennote").appendChild(Object.assign(document.createElement("div"), { id: "claimtokenqr", style: "max-width:220px;margin-top:8px" })), url);
      };
      if (r.ok) { loadLines(); loadOrgs(); }
      $("orgform").onsubmit = async (e) => {
        e.preventDefault(); const name = ($("orgnewname").value || "").trim(); if (!name) return;
        const rr = await fetch("/api/lines/orgs", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name }) }); const d = await rr.json().catch(() => ({}));
        if (!rr.ok) { $("orgformnote").textContent = "Couldn't make it."; return; }
        $("orgnewname").value = ""; showOrgLink(d.link, name); loadOrgs();
      };
      $("regform").onsubmit = async (e) => {
        e.preventDefault(); const link = $("reglink").value.trim(); const mm = link.match(/#([A-Za-z0-9_-]{43})(\.w)?$/); if (!mm) { $("regnote2").textContent = "That isn't a line link."; return; }
        const id = await roomIdOf(mm[1], mm[2] ? ($("regword").value || "").trim() : "");
        const rr = await fetch("/api/lines", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id, label: ($("reglabel").value || "").trim() }) });
        $("regnote2").textContent = rr.ok ? "Registered; open for a year." : "Couldn't register it."; $("reglink").value = ""; $("reglabel").value = ""; $("regword").value = ""; loadLines();
      };
    }
    $("new").addEventListener("click", makeLine);
    $("remake").addEventListener("click", makeLine);
  })();
  // The pin (the trojan-page defence): the service worker keeps the page
  // this phone runs and takes an update only when every file is on the
  // published list. Registered on every load; if it refuses an update, the
  // page says so plainly, on the front door and in the room.
  const PIN_WORDS = { refused: (m) => tr("An update to this page was refused: {f} not on the published list. This phone keeps the version it had. Tell us.", { f: (m.missing || []).join(", ") }), unchecked: () => tr("An update to this page could not be checked against the published list; this phone keeps the version it had for now.") };
  function pinNote(text) { try { const el = $("fpline"); if (el && !$("home").classList.contains("hidden")) el.textContent = text; else $("status").textContent = text; } catch {} }
  async function pinSetup() {
    if (!("serviceWorker" in navigator)) return;
    try {
      navigator.serviceWorker.addEventListener("message", (e) => { const m = e.data || {}; if (PIN_WORDS[m.type]) pinNote(PIN_WORDS[m.type](m)); });
      await navigator.serviceWorker.register("/sw.js");
    } catch {}
  }
  async function pinState() { try { const c = await caches.open("line-pin"); const r = await c.match("/__state"); return r ? await r.json() : null; } catch { return null; } }
  pinSetup();
  addEventListener("appinstalled", () => { try { localStorage.setItem("line:installed", "1"); } catch {} count("install"); });
  try { if ((navigator.standalone === true || matchMedia("(display-mode: standalone)").matches) && !localStorage.getItem("line:installed")) { localStorage.setItem("line:installed", "1"); count("install"); } } catch {}
  addEventListener("pagehide", stop);
  // In the background the page hangs up its socket on purpose, so the
  // mailbox treats this phone as absent and taps it instead of delivering
  // to a screen nobody is looking at. Back in front, it reconnects and
  // picks up whatever waited.
  document.addEventListener("visibilitychange", () => {
    if (!roomId || timer === null) return;
    if (document.visibilityState === "hidden") { if (ws) { try { ws.onclose = null; ws.close(); } catch {} ws = null; } }
    else { if (navigator.clearAppBadge) navigator.clearAppBadge().catch(() => {}); poll(); if (!ws) connect(); }
  });
})();
