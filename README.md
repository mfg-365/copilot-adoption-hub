# Microsoft 365 Copilot — Adoption Strategy Hub

A static, fully interactive planning site for driving **Microsoft 365 Copilot** adoption. Built from the *“Sample Adoption – Copilot Roles & Schedule”* framework and Microsoft’s public adoption resources.

## Pages

| Page | What it does |
| --- | --- |
| **Strategy** (`index.html`) | The adoption approach, a 4-phase journey, and the five adoption personas. |
| **Team & Roles** (`roles.html`) | Microsoft and customer roles with responsibilities and editable, auto-saved assignees. |
| **Schedule** (`schedule.html`) | An interactive Gantt-style timeline that **always starts on the current week**. |
| **Sessions** (`sessions.html`) | Agendas and durations for every training session and workshop. |
| **Resources** (`resources.html`) | Curated links mapped to each phase, plus core hubs and Scenario Library. |

## Interactive schedule features

- **Always moves forward** — the board re-anchors to the Monday of the current week every time it loads.
- **Add / edit / remove blocks** — create your own activities with track, owner, start week, duration and notes.
- **Checkboxes for filtering** — show/hide by track and by owner, or hide completed items.
- **Mark complete** — tick a block off directly on the timeline.
- **Export** — download a **CSV** of the (filtered) plan, or **Export PDF** via the browser print dialog.
- **Persistence** — all edits are stored in the visitor’s browser (`localStorage`); a one-click **Reset to sample** restores the original timeline.

## Tech

Plain HTML/CSS/JavaScript — no build step, no dependencies. Deployed via **GitHub Pages**.

## Local preview

```bash
python -m http.server 8080
# then open http://localhost:8080
```

---

*Internal planning aid. Sample timelines are illustrative — adjust to your organization. Not an official Microsoft product page.*
