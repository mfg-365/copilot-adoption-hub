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
- **Adjustable start date** — pick any Monday as the program start, or click **Today** to snap back to the current week.
- **Add / edit / remove blocks** — create your own activities with track, owner, start week, duration and notes.
- **Checkboxes for filtering** — show/hide by track and by owner, or hide completed items.
- **Mark complete** — tick a block off directly on the timeline.
- **Full-width board + Expand** — the timeline fills the column, with an **Expand** button for a full-browser view.
- **Import / Export** — download a **CSV** or **PDF**, and **Import CSV** to reload a previous export and keep working.
- **Persistence** — all edits are stored in the visitor’s browser (`localStorage`); a one-click **Reset to sample** restores the original timeline.

The **Team & Roles** page also supports **Export CSV** of all roles, responsibilities and assignees.

## Tech

Plain HTML/CSS/JavaScript — no build step, no dependencies. Deployed via **GitHub Pages**.

## Local preview

```bash
python -m http.server 8080
# then open http://localhost:8080
```

---

*Internal planning aid. Sample timelines are illustrative — adjust to your organization. Not an official Microsoft product page.*
