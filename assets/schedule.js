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
      items: SEED.map(function (s, i) { return Object.assign({ id: "seed-" + i, notes: "", done: false }, s); }),
      filters: { tracks: TRACKS.map(function (t) { return t.id; }), owners: OWNERS.map(function (o) { return o.id; }), onlyOpen: false }
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
  var START = mondayOf(new Date());
  function weekStart(i) { var d = new Date(START); d.setDate(d.getDate() + i * 7); return d; }
  function fmtShort(d) { return (d.getMonth() + 1) + "/" + d.getDate(); }
  function fmtLong(d) { return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }); }

  function ownerMeta(id) { return OWNERS.filter(function (o) { return o.id === id; })[0] || OWNERS[0]; }
  function esc(s) { return String(s == null ? "" : s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }
  function uid() { return "u" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

  function visibleItems() {
    return state.items.filter(function (it) {
      if (state.filters.tracks.indexOf(it.track) < 0) return false;
      if (state.filters.owners.indexOf(it.owner) < 0) return false;
      if (state.filters.onlyOpen && it.done) return false;
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
      header += '<div class="gr-week' + (w === 0 ? " gr-now" : "") + '">' +
        '<span class="wk">Wk ' + (w + 1) + '</span><span class="dt">' + fmtShort(d) + '</span>' +
        (w === 0 ? '<span class="now-tag">This week</span>' : '') + '</div>';
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
        cells += '<div class="chip ' + (it.done ? "chip-done " : "") + o.cls + '" ' +
          'style="grid-column:' + (start + 1) + " / span " + span + ';grid-row:' + (it._lane + 1) + '" ' +
          'data-id="' + it.id + '" title="' + esc(it.title) + " · " + o.label + (it.notes ? " — " + esc(it.notes) : "") + '">' +
          '<input type="checkbox" class="chip-check" ' + (it.done ? "checked" : "") + ' aria-label="Mark complete">' +
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
    document.getElementById("count-done").textContent = state.items.filter(function (i) { return i.done; }).length;
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
    document.getElementById("filter-open").checked = state.filters.onlyOpen;
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
      state.items.push(Object.assign({ id: uid(), done: false }, data));
    }
    save(); closeModal(); render();
  }

  /* ---------- export ---------- */
  function exportCSV() {
    var rows = [["Title", "Track", "Owner", "Start week", "Week of", "Duration (weeks)", "Status", "Notes"]];
    visibleItems().slice().sort(function (a, b) { return a.start - b.start; }).forEach(function (it) {
      rows.push([it.title, trackLabel(it.track), ownerMeta(it.owner).label, "Wk " + (it.start + 1),
        fmtLong(weekStart(it.start)), it.span, it.done ? "Complete" : "Planned", it.notes || ""]);
    });
    var csv = rows.map(function (r) { return r.map(function (c) { return '"' + String(c).replace(/"/g, '""') + '"'; }).join(","); }).join("\r\n");
    downloadBlob(csv, "copilot-adoption-schedule.csv", "text/csv;charset=utf-8;");
  }
  function trackLabel(id) { var t = TRACKS.filter(function (x) { return x.id === id; })[0]; return t ? t.label : id; }
  function downloadBlob(content, name, type) {
    var blob = new Blob(["\ufeff" + content], { type: type });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  }
  function exportPDF() {
    var items = visibleItems().slice().sort(function (a, b) { return a.start - b.start || a.track.localeCompare(b.track); });
    var rows = items.map(function (it) {
      return "<tr><td>" + esc(it.title) + "</td><td>" + trackLabel(it.track) + "</td><td>" + ownerMeta(it.owner).label +
        "</td><td>Wk " + (it.start + 1) + "<br><small>" + fmtLong(weekStart(it.start)) + "</small></td><td>" + it.span +
        "</td><td>" + (it.done ? "✓ Complete" : "Planned") + "</td></tr>";
    }).join("");
    var area = document.getElementById("print-area");
    area.innerHTML = '<div class="print-head"><h1>Microsoft 365 Copilot — Adoption Schedule</h1>' +
      '<p>Program window starting week of ' + fmtLong(weekStart(0)) + ' · ' + items.length + ' items</p></div>' +
      '<table class="print-table"><thead><tr><th>Activity</th><th>Track</th><th>Owner</th><th>Start</th><th>Weeks</th><th>Status</th></tr></thead><tbody>' +
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

    document.getElementById("modal-form").addEventListener("submit", submitModal);
    document.getElementById("modal-cancel").addEventListener("click", closeModal);
    document.getElementById("modal").addEventListener("click", function (e) { if (e.target.id === "modal") closeModal(); });

    document.addEventListener("change", function (e) {
      if (e.target.hasAttribute("data-ftrack")) {
        toggleArr(state.filters.tracks, e.target.getAttribute("data-ftrack"), e.target.checked); save(); render();
      } else if (e.target.hasAttribute("data-fowner")) {
        toggleArr(state.filters.owners, e.target.getAttribute("data-fowner"), e.target.checked); save(); render();
      } else if (e.target.id === "filter-open") {
        state.filters.onlyOpen = e.target.checked; save(); render();
      } else if (e.target.classList.contains("chip-check")) {
        var id = e.target.closest(".chip").getAttribute("data-id");
        setDone(id, e.target.checked);
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
      if (e.target.classList.contains("chip-check")) return;
      openModal(state.items.filter(function (it) { return it.id === chip.getAttribute("data-id"); })[0]);
    });

    document.getElementById("select-all-tracks").addEventListener("click", function () { setAll("tracks", TRACKS.map(function (t){return t.id;}), true); });
    document.getElementById("clear-all-tracks").addEventListener("click", function () { setAll("tracks", [], false); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeModal(); });
  }
  function setAll(key, arr, checked) { state.filters[key] = arr.slice(); save(); buildFilters(); render(); }
  function toggleArr(arr, val, on) { var i = arr.indexOf(val); if (on && i < 0) arr.push(val); if (!on && i >= 0) arr.splice(i, 1); }
  function setDone(id, val) { state.items = state.items.map(function (it) { return it.id === id ? Object.assign(it, { done: val }) : it; }); save(); render(); }

  function init() {
    document.getElementById("weeks-sel").value = String(state.weeks);
    buildFilters(); wire(); render();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
