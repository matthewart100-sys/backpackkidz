// Midnight in Charlotte County immediately after GivingTuesday, December 1.
export const campaignEndsAt = Date.parse("2026-12-02T00:00:00-05:00");

export function showGivingTuesday() {
  const logo = document.querySelector(".nav-logo .logo-image");
  const originalLogo = logo?.getAttribute("src");
  const promotion = document.querySelector("[data-giving-tuesday]");
  const campaignPage = document.body.classList.contains("giving-tuesday-page");
  let timer;

  function refresh() {
    window.clearTimeout(timer);
    const remaining = campaignEndsAt - Date.now();
    const active = remaining > 0;
    if (!active && campaignPage) {
      window.location.replace("/pages/donate");
      return;
    }
    if (promotion) promotion.hidden = !active;
    if (logo && originalLogo) {
      logo.setAttribute("src", active ? "/assets/giving-tuesday-backpack.webp" : originalLogo);
    }
    if (active) timer = window.setTimeout(refresh, Math.min(remaining, 2147483647));
  }
  refresh();
  window.addEventListener("pageshow", refresh);
}

if (typeof document !== "undefined") showGivingTuesday();
