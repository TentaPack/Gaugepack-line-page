(async () => {
  const $ = (id) => document.getElementById(id);
  try {
    const t0 = performance.now(); const h = await (await fetch("/api/health", { cache: "no-store" })).json(); const ms = Math.round(performance.now() - t0);
    $("now").textContent = h.ok ? "The mailbox is up." : "The mailbox answered, but the check failed.";
    $("nowtext").textContent = h.ok ? `It wrote and read one thing in ${h.ms} ms; the round trip from your phone took ${ms} ms. Checked just now.` : "A write or a read inside the mailbox did not come back as sent. We are looking.";
  } catch { $("now").textContent = "The mailbox did not answer."; $("nowtext").textContent = "Your phone could not reach it just now. If your signal is fine, we are down."; }
  try {
    const s = await (await fetch("/api/status")).json(); const box = $("days"); const by = new Map(s.days.map((d) => [d.day, d]));
    for (let i = 29; i >= 0; i--) {
      const day = new Date(Date.now() - i * 24 * 3600 * 1000).toISOString().slice(0, 10); const d = by.get(day);
      const el = document.createElement("div"); el.className = "day " + (!d ? "none" : d.fails === 0 ? "up" : d.fails / d.checks > 0.5 ? "down" : "wobble");
      el.title = d ? `${day}: ${d.checks} checks, ${d.fails} failed, ${Math.round(d.ms / Math.max(1, d.checks))} ms average` : `${day}: nothing recorded`; box.appendChild(el);
    }
    if (s.last) $("legend").textContent = `Last self-check ${new Date(s.last.at).toLocaleString()}: ${s.last.ok ? "passed" : "failed"} in ${s.last.ms} ms. ` + $("legend").textContent;
  } catch {}
})();
