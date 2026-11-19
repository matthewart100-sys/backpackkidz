// Midnight in Charlotte County immediately after GivingTuesday, December 1.
export const campaignEndsAt = Date.parse("2026-12-02T00:00:00-05:00");

export function showGivingTuesday() {
  const artwork = "/assets/giving-tuesday-backpack.webp";
  const campaignUrl = "/pages/giving-tuesday";
  const logos = Array.from(document.querySelectorAll(".nav-logo img, .footer-logo img, [data-seasonal-logo]"),
    (image) => [image, image.getAttribute("src")]);
  const icon = document.querySelector('link[rel="icon"]');
  const originalIcon = icon?.getAttribute("href");
  const campaignPage = document.body.classList.contains("giving-tuesday-page");
  const promotions = Array.from(document.querySelectorAll("[data-giving-tuesday]"));
  const navActions = document.querySelector(".navbar .nav-actions");
  if (navActions && Date.now() < campaignEndsAt) {
    const link = document.createElement("a");
    link.className = "giving-nav-button";
    link.href = campaignUrl;
    link.textContent = "GivingTuesday";
    link.hidden = true;
    if (campaignPage) link.setAttribute("aria-current", "page");
    navActions.prepend(link);
    promotions.push(link);
  }
  let timer;

  function refresh() {
    window.clearTimeout(timer);
    const remaining = campaignEndsAt - Date.now();
    const active = remaining > 0;
    if (!active && campaignPage) {
      window.location.replace("/pages/donate");
      return;
    }
    document.body.classList.toggle("giving-tuesday-active", active);
    for (const promotion of promotions) promotion.hidden = !active;
    for (const [image, original] of logos) {
      const src = active ? artwork : original;
      if (image.getAttribute("src") !== src) image.setAttribute("src", src);
    }
    const iconHref = active ? artwork : originalIcon;
    if (icon && icon.getAttribute("href") !== iconHref) icon.setAttribute("href", iconHref);
    if (active) timer = window.setTimeout(refresh, Math.min(remaining, 2147483647));
  }
  refresh();
  window.addEventListener("pageshow", refresh);
}

if (typeof document !== "undefined") showGivingTuesday();
