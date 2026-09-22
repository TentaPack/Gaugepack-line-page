// Buying a year: the page asks the mailbox for a Stripe Checkout and goes
// there. Nothing about a room is in the request; the line is made on the
// buyer's phone after paying, on the claim page.
(() => {
  const $ = (id) => document.getElementById(id);
  // One word for the tally, "the page was opened", with nothing attached; a reload is not a visit.
  try { const nav = performance.getEntriesByType("navigation")[0]; if (!nav || nav.type === "navigate") fetch("/api/count", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ k: "buy_view" }), keepalive: true }).catch(() => {}); } catch {}
  let on = null;
  fetch("/api/prices").then((r) => r.json()).then((p) => { on = !!p.on; if (!on) $("note").textContent = t("Not yet: buying opens soon. If you have a line already, it keeps working."); }).catch(() => {});
  async function buy(kind, code) {
    $("note").textContent = t("Opening the checkout…"); $("renewnote").textContent = "";
    try {
      const r = await fetch("/api/buy", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ kind, ...(code ? { code } : {}) }) });
      const d = await r.json().catch(() => ({}));
      if (r.ok && d.url) { location.assign(d.url); return; }
      const msg = d.error === "not_yet" ? t("Not yet: buying opens soon.") : d.error === "no_code" ? t("That code isn't live. Open the line on your phone and tap Renew for a fresh one.") : d.error === "slow_down" ? t("Too many tries from here; wait a minute.") : `Couldn't open the checkout (${d.message || d.error || r.status}).`;
      (kind === "year" ? $("renewnote") : $("note")).textContent = msg;
    } catch { $("note").textContent = t("Couldn't reach the mailbox."); }
  }
  for (const b of document.querySelectorAll(".plan")) b.onclick = () => buy(b.dataset.kind);
  $("renew").onsubmit = (e) => { e.preventDefault(); const code = $("code").value.toUpperCase().replace(/[^A-Z2-9]/g, ""); if (code.length !== 6) { $("renewnote").textContent = t("Six letters or numbers."); return; } buy("year", code); };
  const pre = new URLSearchParams(location.search).get("renew"); if (pre) { $("code").value = pre.toUpperCase(); $("code").focus(); }
})();
