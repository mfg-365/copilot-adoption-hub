/* Interactive Microsoft 365 Copilot adoption schedule.
   - Always starts on the Monday of the current week ("moving forward").
   - Add / remove / edit blocks, filter by track & owner, mark complete,
     export to CSV or print-to-PDF. State persists in localStorage. */
(function () {
  "use strict";

  var TRACKS = [
    { id: "Awareness",  label: "Awareness" },
    { id: "User",       label: "User" },
    { id: "Power User", label: "Power User" },
    { id: "Builder",    label: "Builder" },
    { id: "Specialist", label: "Specialist" },
    { id: "Champions",  label: "Champions & Project" }
  ];
  var OWNERS = [
    { id: "Microsoft", label: "Microsoft", cls: "o-microsoft" },
    { id: "Customer",  label: "Customer",  cls: "o-customer" },
    { id: "Partner",   label: "Partner",   cls: "o-partner" },
    { id: "FastTrack", label: "FastTrack / CSU", cls: "o-fasttrack" }
  ];

  var SEED = [
    { title: "Survey employees", track: "Awareness", owner: "Customer", start: 0, span: 1 },
    { title: "Assemble core team", track: "Champions", owner: "Customer", start: 0, span: 1 },
    { title: "Weekly stakeholder check-in (Tuesdays)", track: "Champions", owner: "Customer", start: 0, span: 14 },
    { title: "Deliver core team briefing", track: "Champions", owner: "Microsoft", start: 1, span: 1 },
    { title: "Copilot Analytics review", track: "Champions", owner: "Microsoft", start: 1, span: 1 },
    { title: "Data Readiness Workshop", track: "Specialist", owner: "FastTrack", start: 1, span: 1 },
    { title: "Build business case & assess Copilot impact", track: "Champions", owner: "Microsoft", start: 2, span: 2 },
    { title: "Copilot Assurance Workshop", track: "Specialist", owner: "FastTrack", start: 2, span: 1 },
    { title: "Set up a community for champions", track: "Champions", owner: "Customer", start: 2, span: 1 },
    { title: "SharePoint site for training assets", track: "Champions", owner: "Customer", start: 3, span: 1 },
    { title: "Champion Training", track: "Champions", owner: "Microsoft", start: 3, span: 1 },
    { title: "Prompt-a-thon Workshop", track: "Power User", owner: "Microsoft", start: 3, span: 1 },
    { title: "Executive Immersion Session", track: "Awareness", owner: "Microsoft", start: 4, span: 1 },
    { title: "Foundational Training – 4 sessions", track: "User", owner: "Microsoft", start: 4, span: 2 },
    { title: "Email / Viva Engage posts (hints & tips)", track: "Awareness", owner: "Customer", start: 4, span: 8 },
    { title: "Engagement activities", track: "Awareness", owner: "Customer", start: 5, span: 3 },
    { title: "ESI continuous & on-demand training", track: "User", owner: "Microsoft", start: 5, span: 9 },
    { title: "HR Training", track: "User", owner: "Microsoft", start: 6, span: 1 },
    { title: "Copilot Adv. Training – 4 sessions", track: "Power User", owner: "Microsoft", start: 6, span: 2 },
    { title: "Operations Training", track: "User", owner: "Microsoft", start: 7, span: 1 },
    { title: "Marketing Training", track: "User", owner: "Microsoft", start: 7, span: 1 },
    { title: "Sales Training", track: "User", owner: "Microsoft", start: 8, span: 1 },
    { title: "Finance Training", track: "User", owner: "Microsoft", start: 8, span: 1 },
    { title: "Legal Training", track: "User", owner: "Microsoft", start: 8, span: 1 },
    { title: "Other LOB Training", track: "User", owner: "Microsoft", start: 9, span: 1 },
    { title: "Deliver / Govern / Build Agents Workshop", track: "Builder", owner: "Microsoft", start: 9, span: 1 },
    { title: "Building Agents Workshop", track: "Builder", owner: "Microsoft", start: 10, span: 1 },
    { title: "Agent builds", track: "Builder", owner: "Customer", start: 11, span: 2 },
    { title: "Run Copilot Adoption & Impact Reports", track: "Champions", owner: "Microsoft", start: 12, span: 1 },
    { title: "Deliver IT & Executive readout (BCB + impact)", track: "Awareness", owner: "Microsoft", start: 13, span: 1 }
  ];

  var STORE = "cp-adopt-schedule-v1";
  var state = load();

  function defaultState() {
    return {
      weeks: 14,
      anchor: null,
      items: SEED.map(function (s, i) { return Object.assign({ id: "seed-" + i, notes: "" }, s); }),
      filters: { tracks: TRACKS.map(function (t) { return t.id; }), owners: OWNERS.map(function (o) { return o.id; }) }
    };
  }
  function load() {
    try {
      var s = JSON.parse(localStorage.getItem(STORE));
      if (s && s.items) return s;
    } catch (e) {}
    return defaultState();
  }
  function save() { localStorage.setItem(STORE, JSON.stringify(state)); }

  /* ---------- dates ---------- */
  function mondayOf(d) { var x = new Date(d); var day = (x.getDay() + 6) % 7; x.setDate(x.getDate() - day); x.setHours(0,0,0,0); return x; }
  function currentMonday() { return mondayOf(new Date()); }
  function startMonday() { return state.anchor ? mondayOf(new Date(state.anchor + "T00:00:00")) : currentMonday(); }
  function weekStart(i) { var d = new Date(startMonday()); d.setDate(d.getDate() + i * 7); return d; }
  function isCurrentWeek(i) { return weekStart(i).getTime() === currentMonday().getTime(); }
  function toISODate(d) { var m = String(d.getMonth() + 1).padStart(2, "0"); var day = String(d.getDate()).padStart(2, "0"); return d.getFullYear() + "-" + m + "-" + day; }
  function fmtShort(d) { return (d.getMonth() + 1) + "/" + d.getDate(); }
  function fmtLong(d) { return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }); }

  function ownerMeta(id) { return OWNERS.filter(function (o) { return o.id === id; })[0] || OWNERS[0]; }
  function esc(s) { return String(s == null ? "" : s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }
  function uid() { return "u" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

  function visibleItems() {
    return state.items.filter(function (it) {
      if (state.filters.tracks.indexOf(it.track) < 0) return false;
      if (state.filters.owners.indexOf(it.owner) < 0) return false;
      return true;
    });
  }

  /* greedy lane packing so chips in a track never overlap */
  function packLanes(items) {
    var lanes = [];
    items.slice().sort(function (a, b) { return a.start - b.start || b.span - a.span; }).forEach(function (it) {
      var placed = false;
      for (var l = 0; l < lanes.length; l++) {
        var ok = lanes[l].every(function (o) { return it.start >= o.start + o.span || it.start + it.span <= o.start; });
        if (ok) { lanes[l].push(it); it._lane = l; placed = true; break; }
      }
      if (!placed) { it._lane = lanes.length; lanes.push([it]); }
    });
    return Math.max(1, lanes.length);
  }

  /* ---------- render ---------- */
  function render() {
    var N = state.weeks;
    var vis = visibleItems();
    var board = document.getElementById("board");
    var colMin = 112, labelW = 190;
    var minWidth = labelW + N * colMin;

    // header
    var header = '<div class="gr-row gr-head" style="min-width:' + minWidth + 'px">' +
      '<div class="gr-label">Track</div><div class="gr-cells" style="grid-template-columns:repeat(' + N + ',1fr)">';
    for (var w = 0; w < N; w++) {
      var d = weekStart(w);
      var now = isCurrentWeek(w);
      header += '<div class="gr-week' + (now ? " gr-now" : "") + '">' +
        '<span class="wk">Wk ' + (w + 1) + '</span><span class="dt">' + fmtShort(d) + '</span>' +
        (now ? '<span class="now-tag">This week</span>' : '') + '</div>';
    }
    header += "</div></div>";

    var rows = "";
    TRACKS.forEach(function (t) {
      if (state.filters.tracks.indexOf(t.id) < 0) return;
      var items = vis.filter(function (it) { return it.track === t.id; });
      var laneCount = packLanes(items);
      var rowH = laneCount * 46 + 10;
      var cells = '<div class="gr-cells lane-grid" style="grid-template-columns:repeat(' + N + ',1fr);grid-auto-rows:40px;min-height:' + rowH + 'px">';
      // faint current-week guide
      items.forEach(function (it) {
        var start = Math.max(0, it.start);
        if (start >= N) return; // off to the right of window
        var span = Math.min(it.span, N - start);
        var o = ownerMeta(it.owner);
        cells += '<div class="chip ' + o.cls + '" ' +
          'style="grid-column:' + (start + 1) + " / span " + span + ';grid-row:' + (it._lane + 1) + '" ' +
          'data-id="' + it.id + '" title="' + esc(it.title) + " · " + o.label + (it.notes ? " — " + esc(it.notes) : "") + '">' +
          '<span class="chip-title">' + esc(it.title) + '</span>' +
          '<span class="chip-actions">' +
            '<button class="chip-edit" title="Edit" aria-label="Edit">✎</button>' +
            '<button class="chip-del" title="Remove" aria-label="Remove">×</button>' +
          '</span>' +
          '</div>';
      });
      cells += "</div>";
      rows += '<div class="gr-row" style="min-width:' + minWidth + 'px">' +
        '<div class="gr-label"><span class="pill">' + t.label + '</span><span class="lane-count">' + items.length + ' item' + (items.length === 1 ? "" : "s") + '</span></div>' +
        cells + "</div>";
    });

    board.innerHTML = header + (rows || '<div class="empty">No items match the current filters.</div>');
    document.getElementById("count-total").textContent = state.items.length;
    document.getElementById("count-shown").textContent = vis.length;
    renderChips();
  }

  function renderChips() {} // reserved

  /* ---------- filters UI ---------- */
  function buildFilters() {
    var tw = document.getElementById("filter-tracks");
    tw.innerHTML = TRACKS.map(function (t) {
      var on = state.filters.tracks.indexOf(t.id) >= 0;
      return '<label class="chk"><input type="checkbox" data-ftrack="' + t.id + '" ' + (on ? "checked" : "") + '> ' + t.label + '</label>';
    }).join("");
    var ow = document.getElementById("filter-owners");
    ow.innerHTML = OWNERS.map(function (o) {
      var on = state.filters.owners.indexOf(o.id) >= 0;
      return '<label class="chk"><input type="checkbox" data-fowner="' + o.id + '" ' + (on ? "checked" : "") + '> <span class="badge-owner ' + o.cls + '">' + o.label + '</span></label>';
    }).join("");
  }

  /* ---------- modal (add / edit) ---------- */
  function weekOptions(sel) {
    var out = "";
    for (var i = 0; i < state.weeks; i++) {
      out += '<option value="' + i + '"' + (i === sel ? " selected" : "") + '>Wk ' + (i + 1) + ' — ' + fmtLong(weekStart(i)) + "</option>";
    }
    return out;
  }
  function openModal(item) {
    var editing = !!item;
    document.getElementById("modal-title").textContent = editing ? "Edit block" : "Add a block";
    document.getElementById("f-id").value = editing ? item.id : "";
    document.getElementById("f-title").value = editing ? item.title : "";
    document.getElementById("f-notes").value = editing ? (item.notes || "") : "";
    document.getElementById("f-track").innerHTML = TRACKS.map(function (t) { return '<option value="' + t.id + '"' + (editing && item.track === t.id ? " selected" : "") + '>' + t.label + "</option>"; }).join("");
    document.getElementById("f-owner").innerHTML = OWNERS.map(function (o) { return '<option value="' + o.id + '"' + (editing && item.owner === o.id ? " selected" : "") + '>' + o.label + "</option>"; }).join("");
    document.getElementById("f-start").innerHTML = weekOptions(editing ? item.start : 0);
    document.getElementById("f-span").value = editing ? item.span : 1;
    document.getElementById("modal").classList.add("open");
    setTimeout(function () { document.getElementById("f-title").focus(); }, 30);
  }
  function closeModal() { document.getElementById("modal").classList.remove("open"); }

  function submitModal(e) {
    e.preventDefault();
    var id = document.getElementById("f-id").value;
    var data = {
      title: document.getElementById("f-title").value.trim() || "Untitled block",
      track: document.getElementById("f-track").value,
      owner: document.getElementById("f-owner").value,
      start: parseInt(document.getElementById("f-start").value, 10) || 0,
      span: Math.max(1, parseInt(document.getElementById("f-span").value, 10) || 1),
      notes: document.getElementById("f-notes").value.trim()
    };
    if (id) {
      state.items = state.items.map(function (it) { return it.id === id ? Object.assign(it, data) : it; });
    } else {
      state.items.push(Object.assign({ id: uid() }, data));
    }
    save(); closeModal(); render();
  }

  /* ---------- export ---------- */
  function exportCSV() {
    var rows = [["Title", "Track", "Owner", "Start week", "Week of", "Duration (weeks)", "Notes"]];
    visibleItems().slice().sort(function (a, b) { return a.start - b.start; }).forEach(function (it) {
      rows.push([it.title, trackLabel(it.track), ownerMeta(it.owner).label, "Wk " + (it.start + 1),
        fmtLong(weekStart(it.start)), it.span, it.notes || ""]);
    });
    var csv = rows.map(function (r) { return r.map(function (c) { return '"' + String(c).replace(/"/g, '""') + '"'; }).join(","); }).join("\r\n");
    downloadBlob(csv, "copilot-adoption-schedule.csv", "text/csv;charset=utf-8;");
  }
  function trackLabel(id) { var t = TRACKS.filter(function (x) { return x.id === id; })[0]; return t ? t.label : id; }
  function trackFromLabel(s) { s = String(s || "").trim().toLowerCase(); var m = TRACKS.filter(function (t) { return t.id.toLowerCase() === s || t.label.toLowerCase() === s; })[0]; return m ? m.id : "User"; }
  function ownerFromLabel(s) { s = String(s || "").trim().toLowerCase(); var m = OWNERS.filter(function (o) { return o.id.toLowerCase() === s || o.label.toLowerCase() === s; })[0]; return m ? m.id : "Customer"; }
  function downloadBlob(content, name, type) {
    var blob = new Blob(["\ufeff" + content], { type: type });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  }

  /* ---------- import ---------- */
  function parseCSV(text) {
    text = text.replace(/^\ufeff/, "");
    var rows = [], row = [], cur = "", inQ = false;
    for (var i = 0; i < text.length; i++) {
      var c = text[i];
      if (inQ) {
        if (c === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else inQ = false; }
        else cur += c;
      } else {
        if (c === '"') inQ = true;
        else if (c === ",") { row.push(cur); cur = ""; }
        else if (c === "\n") { row.push(cur); rows.push(row); row = []; cur = ""; }
        else if (c === "\r") { /* skip */ }
        else cur += c;
      }
    }
    if (cur.length || row.length) { row.push(cur); rows.push(row); }
    return rows.filter(function (r) { return r.some(function (c) { return String(c).trim() !== ""; }); });
  }
  function importCSV(text) {
    var rows = parseCSV(text);
    if (!rows.length) { alert("That file appears to be empty."); return; }
    var header = rows[0].map(function (h) { return String(h).trim().toLowerCase(); });
    function col(names) { for (var n = 0; n < names.length; n++) { var idx = header.indexOf(names[n]); if (idx >= 0) return idx; } return -1; }
    var iTitle = col(["title", "activity"]), iTrack = col(["track"]), iOwner = col(["owner"]),
        iStart = col(["start week", "start"]), iSpan = col(["duration (weeks)", "duration", "weeks", "span"]),
        iNotes = col(["notes"]);
    if (iTitle < 0) { alert("Couldn't find a Title/Activity column in that CSV. Use a file exported from this schedule."); return; }
    var items = [];
    for (var r = 1; r < rows.length; r++) {
      var cells = rows[r];
      var title = (cells[iTitle] || "").trim();
      if (!title) continue;
      var startRaw = iStart >= 0 ? String(cells[iStart] || "") : "1";
      var startNum = parseInt((startRaw.match(/\d+/) || ["1"])[0], 10);
      var start = Math.max(0, (isNaN(startNum) ? 1 : startNum) - 1);
      var span = iSpan >= 0 ? Math.max(1, parseInt(cells[iSpan], 10) || 1) : 1;
      items.push({
        id: uid(), title: title,
        track: trackFromLabel(iTrack >= 0 ? cells[iTrack] : "User"),
        owner: ownerFromLabel(iOwner >= 0 ? cells[iOwner] : "Customer"),
        start: start, span: span,
        notes: iNotes >= 0 ? String(cells[iNotes] || "").trim() : ""
      });
    }
    if (!items.length) { alert("No schedule rows found in that CSV."); return; }
    var maxWeek = items.reduce(function (m, it) { return Math.max(m, it.start + it.span); }, 0);
    if (maxWeek > state.weeks) { state.weeks = [8, 14, 20, 26].filter(function (w) { return w >= maxWeek; })[0] || 26; }
    state.items = items;
    save(); buildFilters();
    document.getElementById("weeks-sel").value = String(state.weeks);
    render();
    alert("Imported " + items.length + " item" + (items.length === 1 ? "" : "s") + " from your CSV.");
  }
  function exportPDF() {
    var items = visibleItems().slice().sort(function (a, b) { return a.start - b.start || a.track.localeCompare(b.track); });
    var rows = items.map(function (it) {
      return "<tr><td>" + esc(it.title) + "</td><td>" + trackLabel(it.track) + "</td><td>" + ownerMeta(it.owner).label +
        "</td><td>Wk " + (it.start + 1) + "<br><small>" + fmtLong(weekStart(it.start)) + "</small></td><td>" + it.span +
        "</td></tr>";
    }).join("");
    var area = document.getElementById("print-area");
    area.innerHTML = '<div class="print-head"><h1>Microsoft 365 Copilot — Adoption Schedule</h1>' +
      '<p>Program window starting week of ' + fmtLong(weekStart(0)) + ' · ' + items.length + ' items</p></div>' +
      '<table class="print-table"><thead><tr><th>Activity</th><th>Track</th><th>Owner</th><th>Start</th><th>Weeks</th></tr></thead><tbody>' +
      rows + "</tbody></table>";
    window.print();
  }

  /* ---------- events ---------- */
  function wire() {
    document.getElementById("add-block").addEventListener("click", function () { openModal(null); });
    document.getElementById("export-csv").addEventListener("click", exportCSV);
    document.getElementById("export-pdf").addEventListener("click", exportPDF);
    document.getElementById("reset-sample").addEventListener("click", function () {
      if (confirm("Reset the schedule back to the sample timeline? Your changes in this browser will be lost.")) {
        state = defaultState(); save(); buildFilters(); render();
      }
    });
    document.getElementById("weeks-sel").addEventListener("change", function (e) {
      state.weeks = parseInt(e.target.value, 10); save(); render();
    });

    var dateInput = document.getElementById("anchor-date");
    if (dateInput) {
      dateInput.addEventListener("change", function (e) {
        state.anchor = e.target.value || null; save(); render();
      });
    }
    var resetDate = document.getElementById("anchor-reset");
    if (resetDate) {
      resetDate.addEventListener("click", function () {
        state.anchor = null; save();
        document.getElementById("anchor-date").value = toISODate(currentMonday());
        render();
      });
    }
    var importInput = document.getElementById("import-file");
    if (importInput) {
      document.getElementById("import-csv").addEventListener("click", function () { importInput.click(); });
      importInput.addEventListener("change", function (e) {
        var file = e.target.files && e.target.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function () {
          if (confirm("Import will replace the current items on your board. Continue?")) importCSV(String(reader.result));
          importInput.value = "";
        };
        reader.readAsText(file);
      });
    }

    document.getElementById("modal-form").addEventListener("submit", submitModal);
    document.getElementById("modal-cancel").addEventListener("click", closeModal);
    document.getElementById("modal").addEventListener("click", function (e) { if (e.target.id === "modal") closeModal(); });

    document.addEventListener("change", function (e) {
      if (e.target.hasAttribute("data-ftrack")) {
        toggleArr(state.filters.tracks, e.target.getAttribute("data-ftrack"), e.target.checked); save(); render();
      } else if (e.target.hasAttribute("data-fowner")) {
        toggleArr(state.filters.owners, e.target.getAttribute("data-fowner"), e.target.checked); save(); render();
      }
    });

    document.getElementById("board").addEventListener("click", function (e) {
      var chip = e.target.closest(".chip"); if (!chip) return;
      var id = chip.getAttribute("data-id");
      if (e.target.classList.contains("chip-del")) {
        state.items = state.items.filter(function (it) { return it.id !== id; }); save(); render();
      } else if (e.target.classList.contains("chip-edit")) {
        openModal(state.items.filter(function (it) { return it.id === id; })[0]);
      }
    });
    document.getElementById("board").addEventListener("dblclick", function (e) {
      var chip = e.target.closest(".chip"); if (!chip) return;
      openModal(state.items.filter(function (it) { return it.id === chip.getAttribute("data-id"); })[0]);
    });

    document.getElementById("select-all-tracks").addEventListener("click", function () { setAll("tracks", TRACKS.map(function (t){return t.id;}), true); });
    document.getElementById("clear-all-tracks").addEventListener("click", function () { setAll("tracks", [], false); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeModal(); });
  }
  function setAll(key, arr, checked) { state.filters[key] = arr.slice(); save(); buildFilters(); render(); }
  function toggleArr(arr, val, on) { var i = arr.indexOf(val); if (on && i < 0) arr.push(val); if (!on && i >= 0) arr.splice(i, 1); }

  function init() {
    try {
      normalizeState();
      save();
      document.getElementById("weeks-sel").value = String(state.weeks);
      var di = document.getElementById("anchor-date");
      if (di) di.value = state.anchor || toISODate(currentMonday());
      buildFilters(); wire(); render();
    } catch (err) {
      // A corrupt saved state or version mismatch must never leave a blank, dead page.
      try { console.error("Schedule init failed, resetting to sample.", err); } catch (e) {}
      state = defaultState(); save();
      try {
        document.getElementById("weeks-sel").value = String(state.weeks);
        var d2 = document.getElementById("anchor-date");
        if (d2) d2.value = toISODate(currentMonday());
        buildFilters(); wire(); render();
      } catch (e2) {}
    }
  }
  function normalizeState() {
    if (!state || typeof state !== "object") state = defaultState();
    if (!Array.isArray(state.items)) state.items = defaultState().items;
    if (typeof state.weeks !== "number") state.weeks = 14;
    if (!state.filters || typeof state.filters !== "object") state.filters = {};
    if (!Array.isArray(state.filters.tracks)) state.filters.tracks = TRACKS.map(function (t) { return t.id; });
    if (!Array.isArray(state.filters.owners)) state.filters.owners = OWNERS.map(function (o) { return o.id; });
    state.items.forEach(function (it) {
      if (!it.id) it.id = uid();
      it.start = Math.max(0, parseInt(it.start, 10) || 0);
      it.span = Math.max(1, parseInt(it.span, 10) || 1);
      if (TRACKS.map(function (t) { return t.id; }).indexOf(it.track) < 0) it.track = "User";
      if (OWNERS.map(function (o) { return o.id; }).indexOf(it.owner) < 0) it.owner = "Customer";
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
