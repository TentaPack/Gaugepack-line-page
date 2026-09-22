// The fingerprints: each served file fetched fresh and hashed in this
// browser, then checked three ways: against what the server says it
// serves, against the published list (an append-only record in a public
// repository, signed by Gaugepack), and against what this phone's own
// service worker pinned. If any of the three disagree, it says so plainly.
(async () => {
  const PUBLISHED = "https://raw.githubusercontent.com/TentaPack/Gaugepack-line-page/main/hashes.json";
  const files = ["index.html", "line.js", "strings.js", "qrcode.js", "line.css", "sw.js", "manifest.webmanifest", "vendor/lame.min.js", "buy.html", "buy.js", "doors.html", "doors.js", "terms.html", "privacy.html", "code.html", "code.js", "status.html", "status.js"];
  const $ = (id) => document.getElementById(id);
  const box = $("files");
  const hex = (b) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
  const rows = new Map(), mine = new Map();
  for (const f of files) {
    const row = document.createElement("div"); row.className = "lrow";
    const left = document.createElement("div"); left.className = "lmeta";
    const a = document.createElement("a"); a.href = "/" + f; a.textContent = f; a.style.color = "inherit"; a.target = "_blank"; a.rel = "noopener"; left.appendChild(a);
    const h = document.createElement("code"); h.className = "hint"; h.textContent = "fetching…"; left.appendChild(h);
    const v = document.createElement("span"); v.className = "hint"; v.style.margin = "0"; row.appendChild(left); row.appendChild(v); box.appendChild(row); rows.set(f, { h, v });
  }
  for (const f of files) {
    try { const buf = await (await fetch("/" + f, { cache: "no-store" })).arrayBuffer(); const sha = hex(await crypto.subtle.digest("SHA-256", buf)); mine.set(f, sha); rows.get(f).h.textContent = `sha256 ${sha} · ${buf.byteLength.toLocaleString()} bytes`; }
    catch { rows.get(f).h.textContent = "could not fetch"; }
  }
  // 1. The server's word for line.js.
  try {
    const server = await (await fetch("/api/fingerprint")).json();
    $("server").textContent = server.sha256 === mine.get("line.js") ? `The server says it serves line.js ${server.sha256.slice(0, 16)}…, and that is what this browser received.` : `The server says it serves line.js ${server.sha256.slice(0, 16)}…, but this browser received ${(mine.get("line.js") || "").slice(0, 16)}…. That is a problem; tell us.`;
  } catch {}
  // 2. The published list, fetched from the public repository, not from us.
  let list = null;
  try { const r = await fetch(`${PUBLISHED}?t=${Date.now()}`, { cache: "no-store" }); if (r.ok) list = await r.json(); } catch {}
  const pub = $("published");
  if (!list || !Array.isArray(list.releases)) pub.textContent = "The published list could not be fetched from github.com just now (your network, or theirs). Try again, or check by hand: the repository is linked below.";
  else {
    const inList = (f, sha) => list.releases.some((rel) => (rel.files || []).some((x) => x.file === f && x.sha256 === sha));
    const bad = [];
    for (const f of files) { const sha = mine.get(f); const ok = sha && inList(f, sha); rows.get(f).v.textContent = !sha ? "" : ok ? "published" : "NOT PUBLISHED"; rows.get(f).v.style.color = ok ? "#2FBF71" : "var(--accent)"; if (sha && !ok) bad.push(f); }
    const latest = list.releases[list.releases.length - 1];
    pub.textContent = bad.length ? `These files are NOT on the published list: ${bad.join(", ")}. Either we published a new version minutes ago and the list has not caught up, or this phone was given code nobody else can see. Reload in five minutes; if it still says this, tell us and stop using this phone's line.` : `Every file this browser received is on the published list (${list.releases.length} release${list.releases.length === 1 ? "" : "s"}, the latest ${latest.version} on ${new Date(latest.at).toLocaleDateString()}).`;
  }
  // 3. What this phone's service worker pinned.
  try {
    const c = await caches.open("line-pin"); const r = await c.match("/__state"); const pin = r ? await r.json() : null;
    $("pin").textContent = !pin ? "This phone has not pinned the page yet (the service worker installs on the first visit and checks the list; a browser without service workers never pins)."
      : pin.refused ? `This phone REFUSED an update: ${pin.refused.missing.join(", ")} not on the published list (version ${pin.refused.version}, ${new Date(pin.refused.at).toLocaleString()}). It keeps the version it had. Tell us.`
      : `This phone runs pinned version ${pin.version}, ${pin.verified ? "checked against the published list" : "installed while the list was unreachable, not yet checked"} on ${new Date(pin.at).toLocaleString()}.${pin.unchecked ? " A later update was held because the list could not be fetched." : ""}`;
  } catch { $("pin").textContent = ""; }
})();
