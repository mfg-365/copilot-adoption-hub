/* Shared site chrome: nav + footer, injected on every page. */
(function () {
  var pages = [
    { href: "index.html", label: "Strategy" },
    { href: "roles.html", label: "Team & Roles" },
    { href: "schedule.html", label: "Schedule" },
    { href: "sessions.html", label: "Sessions" },
    { href: "resources.html", label: "Resources" }
  ];
  var here = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  if (here === "") here = "index.html";

  var links = pages.map(function (p) {
    var active = p.href.toLowerCase() === here ? ' class="active"' : "";
    return '<a href="' + p.href + '"' + active + '>' + p.label + "</a>";
  }).join("");

  var navHTML =
    '<nav class="nav"><div class="nav-inner">' +
      '<a class="brand" href="index.html"><span class="spark" aria-hidden="true"></span>' +
      'Microsoft 365 Copilot <span style="color:var(--muted);font-weight:600">Adoption</span></a>' +
      '<button class="nav-toggle" aria-label="Menu">&#9776;</button>' +
      '<div class="nav-links">' + links + "</div>" +
    "</div></nav>";

  var footHTML =
    '<footer class="footer"><div class="container"><div class="foot-grid">' +
      '<div><div class="brand"><span class="spark" aria-hidden="true"></span>Microsoft 365 Copilot Adoption</div>' +
        '<p style="color:rgba(255,255,255,.7);margin:.6rem 0 0;max-width:42ch">A planning hub for driving Copilot adoption — roles, phased schedule, sessions and resources.</p></div>' +
      '<div><strong style="color:#fff">Key resources</strong><br>' +
        '<a href="https://adoption.microsoft.com/en-us/copilot/" target="_blank" rel="noopener">Copilot Adoption Hub</a><br>' +
        '<a href="https://adoption.microsoft.com/en-us/scenario-library/" target="_blank" rel="noopener">Scenario Library</a><br>' +
        '<a href="https://learn.microsoft.com/en-us/copilot/microsoft-365/" target="_blank" rel="noopener">Copilot on Microsoft Learn</a></div>' +
      "</div>" +
      '<p class="disclaimer">This is an internal planning aid built from the “Sample Adoption – Copilot Roles &amp; Schedule” template. ' +
      'Sample timelines are illustrative — adjust to your organization. Not an official Microsoft product page.</p>' +
      '<p class="disclaimer">Availability of Microsoft-delivered resources, workshops and engagements shown here depends on the customer’s specific contract, entitlements and eligibility. Confirm scope with your Microsoft account team.</p>' +
    "</div></footer>";

  function mount() {
    var n = document.getElementById("site-nav");
    var f = document.getElementById("site-footer");
    if (n) n.innerHTML = navHTML;
    if (f) f.innerHTML = footHTML;
    var toggle = document.querySelector(".nav-toggle");
    var menu = document.querySelector(".nav-links");
    if (toggle && menu) toggle.addEventListener("click", function () { menu.classList.toggle("open"); });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount);
  else mount();
})();
