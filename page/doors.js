// A door, bought: Stripe Checkout as a subscription; after paying, the
// success page hands the phone a door token and that phone makes the door.
(() => {
  const $ = (id) => document.getElementById(id);
  // One word for the tally, "the page was opened", with nothing attached; a reload is not a visit.
  try { const nav = performance.getEntriesByType("navigation")[0]; if (!nav || nav.type === "navigate") fetch("/api/count", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ k: "doors_view" }), keepalive: true }).catch(() => {}); } catch {}
  fetch("/api/prices").then((r) => r.json()).then((p) => { if (!p.on) $("note").textContent = "Not yet: buying opens soon. Doors are made from the maker until then."; }).catch(() => {});
  for (const b of document.querySelectorAll(".plan")) b.onclick = async () => {
    $("note").textContent = t("Opening the checkout…");
    try {
      const r = await fetch("/api/buy", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ kind: b.dataset.kind }) });
      const d = await r.json().catch(() => ({}));
      if (r.ok && d.url) { location.assign(d.url); return; }
      $("note").textContent = d.error === "not_yet" ? t("Not yet: buying opens soon.") : d.error === "slow_down" ? t("Too many tries from here; wait a minute.") : `Couldn't open the checkout (${d.message || d.error || r.status}).`;
    } catch { $("note").textContent = t("Couldn't reach the mailbox."); }
  };
})();
