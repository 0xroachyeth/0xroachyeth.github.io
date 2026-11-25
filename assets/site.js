/* Ethan Roach site script: menu, forms, and the Sunrise Log. */

// ---- Settings you edit -------------------------------------------------
// Paste ONE Formspree form URL here (https://formspree.io/f/xxxxxxx) and all
// three forms send to it. Each signup carries a "list" field (sunrise-reset,
// walk-with-me, grove-waitlist) so you can tell them apart in your inbox.
// Until it's filled in, forms say honestly that signups aren't open yet.
const FORM_URL = "https://formspree.io/f/xrpqjonb";
// Optional: give a form its own URL to override FORM_URL for that form.
const FORM_ENDPOINTS = {
  reset: "",     // 7-Day Sunrise Reset email signup
  walk: "",     // "Walk with me" one-on-one inquiry form
  grove: ""     // The Grove community waitlist
};
// The day EXP-003 (30 days outside before sunrise) started, YYYY-MM-DD.
// Leave empty until you start; progress then counts log entries from that date.
const EXP003_START = "";
// ------------------------------------------------------------------------

(function () {
  // Mobile menu
  const btn = document.querySelector(".menu-btn");
  const nav = document.getElementById("site-nav");
  if (btn && nav) {
    btn.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      btn.setAttribute("aria-expanded", String(open));
    });
  }

  // Forms
  document.querySelectorAll("form[data-form]").forEach((form) => {
    const status = form.querySelector(".form-status");
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const endpoint = FORM_ENDPOINTS[form.dataset.form] || FORM_URL;
      const say = (msg, cls) => { if (status) { status.textContent = msg; status.className = "form-status " + (cls || ""); } };
      if (!endpoint) {
        say("Signups open soon. This form isn't connected yet.", "warn");
        return;
      }
      const submit = form.querySelector("button[type=submit]");
      if (submit) submit.disabled = true;
      say("Sending…");
      try {
        const res = await fetch(endpoint, { method: "POST", body: new FormData(form), headers: { Accept: "application/json" } });
        if (!res.ok) throw new Error(String(res.status));
        form.reset();
        say(form.dataset.form === "walk" ? "Got it. I'll get back to you soon." : form.dataset.form === "grove" ? "You're on the list. I'll let you know when The Grove opens." : "You're on the list.", "ok");
      } catch (err) {
        say("That didn't go through. Please try again in a minute.", "warn");
      } finally {
        if (submit) submit.disabled = false;
      }
    });
  });

  // Sunrise Log
  const needsLog = document.querySelector("[data-log]");
  if (!needsLog) return;

  fetch("/data/log.json", { cache: "no-cache" })
    .then((r) => (r.ok ? r.json() : []))
    .catch(() => [])
    .then((entries) => {
      entries = (Array.isArray(entries) ? entries : []).filter((e) => e && e.date);
      entries.sort((a, b) => (a.date < b.date ? 1 : -1));
      const latest = entries[0];
      const streak = calcStreak(entries);

      // Home strip
      const strip = document.querySelector("[data-log=strip]");
      if (strip) {
        if (latest) {
          setText(strip, "day", "Day " + (latest.day ?? entries.length));
          setText(strip, "sunrise", "Sunrise " + (latest.sunrise || "—"));
          setText(strip, "outside", "Outside " + (latest.outside || "—"));
          setText(strip, "streak", "Streak " + streak + (streak === 1 ? " day" : " days"));
          const link = strip.querySelector("[data-k=link]");
          if (link) link.href = "/log/#day-" + (latest.day ?? entries.length);
        } else {
          setText(strip, "day", "Day 1 starts soon");
          ["sunrise", "outside", "streak"].forEach((k) => hide(strip, k));
        }
      }

      // Log page
      const list = document.querySelector("[data-log=list]");
      if (list) {
        setStat("count", entries.length);
        setStat("streak", streak);
        setStat("best", bestStreak(entries));
        if (!entries.length) {
          list.innerHTML = '<div class="empty">The first entry goes up on Day 1. Check back at sunrise.</div>';
        } else {
          list.innerHTML = entries.map(renderEntry).join("");
          if (location.hash) {
            const el = document.getElementById(location.hash.slice(1));
            if (el) el.scrollIntoView();
          }
        }
      }

      // EXP-003 progress
      const prog = document.querySelector("[data-log=progress]");
      if (prog) {
        const done = EXP003_START ? Math.min(30, entries.filter((e) => e.date >= EXP003_START).length) : 0;
        const cells = prog.querySelector(".progress");
        if (cells) cells.innerHTML = Array.from({ length: 30 }, (_, i) => '<span class="' + (i < done ? "on" : "") + '"></span>').join("");
        document.querySelectorAll("[data-k=exp-day]").forEach((el) => {
          el.textContent = EXP003_START ? "Day " + done + " / 30" : "Starts soon";
        });
      }
    });

  function setText(root, k, v) { const el = root.querySelector("[data-k=" + k + "]"); if (el) el.textContent = v; }
  function hide(root, k) { const el = root.querySelector("[data-k=" + k + "]"); if (el) el.hidden = true; }
  function setStat(k, v) { const el = document.querySelector("[data-stat=" + k + "]"); if (el) el.textContent = String(v); }

  function dayNum(iso) { const [y, m, d] = iso.split("-").map(Number); return Math.round(Date.UTC(y, m - 1, d) / 864e5); }
  function todayNum() { const t = new Date(); return Math.round(Date.UTC(t.getFullYear(), t.getMonth(), t.getDate()) / 864e5); }

  function calcStreak(sorted) {
    if (!sorted.length) return 0;
    const days = [...new Set(sorted.map((e) => dayNum(e.date)))].sort((a, b) => b - a);
    if (todayNum() - days[0] > 1) return 0;
    let n = 1;
    for (let i = 1; i < days.length && days[i - 1] - days[i] === 1; i++) n++;
    return n;
  }
  function bestStreak(sorted) {
    const days = [...new Set(sorted.map((e) => dayNum(e.date)))].sort((a, b) => a - b);
    let best = 0, run = 0;
    days.forEach((d, i) => { run = i && d - days[i - 1] === 1 ? run + 1 : 1; best = Math.max(best, run); });
    return best;
  }

  function esc(s) { return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
  function fmtDate(iso) {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
  }
  function renderEntry(e, i, all) {
    const day = e.day ?? all.length - i;
    return '<article class="entry" id="day-' + esc(day) + '">' +
      '<div class="entry-day">Day ' + esc(day) + "</div>" +
      '<div class="entry-body">' +
        '<div class="entry-meta"><span>' + esc(fmtDate(e.date)) + "</span>" +
          (e.sunrise ? "<span>Sunrise " + esc(e.sunrise) + "</span>" : "") +
          (e.outside ? "<span>Outside " + esc(e.outside) + "</span>" : "") + "</div>" +
        (e.note ? '<p class="entry-note">' + esc(e.note) + "</p>" : "") +
        (e.photo ? '<img src="' + esc(e.photo) + '" alt="' + esc(e.alt || "Sunrise, day " + day) + '" loading="lazy">' : "") +
      "</div></article>";
  }
})();
