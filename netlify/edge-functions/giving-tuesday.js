import { campaignEndsAt } from "../../BackPackKidzWebsite/giving-tuesday.js";

export default async function givingTuesday(request, context) {
  const url = new URL(request.url);
  if (/^\/pages\/our-partners(?:\/|\.html)?$/u.test(url.pathname)) {
    if (Date.now() >= campaignEndsAt || request.method !== "GET") return;

    const page = await context.next();
    if (page.status !== 200 || !page.headers.get("Content-Type")?.startsWith("text/html")) return page;

    // Load the sitewide campaign presentation alongside the signed Partners source.
    const html = (await page.text()).replace("</head>", '<script type="module" src="/giving-tuesday.js"></script></head>');
    const response = new Response(html, page);
    for (const header of ["Content-Length", "Content-Encoding", "ETag", "Last-Modified"]) {
      response.headers.delete(header);
    }
    response.headers.set("Cache-Control", "no-store");
    return response;
  }

  if (Date.now() >= campaignEndsAt) {
    return new Response(null, {
      status: 302,
      headers: { Location: new URL("/pages/donate", url).href, "Cache-Control": "no-store" },
    });
  }
  const page = await context.next();
  const response = new Response(page.body, page);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export const config = {
  path: [
    "/pages/giving-tuesday", "/pages/giving-tuesday/", "/pages/giving-tuesday.html",
    "/pages/our-partners", "/pages/our-partners/", "/pages/our-partners.html",
  ],
};
