import { campaignEndsAt } from "../../BackPackKidzWebsite/giving-tuesday.js";

export default async function givingTuesday(request, context) {
  if (Date.now() >= campaignEndsAt) {
    return new Response(null, {
      status: 302,
      headers: { Location: new URL("/pages/donate", request.url).href, "Cache-Control": "no-store" },
    });
  }
  const page = await context.next();
  const response = new Response(page.body, page);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export const config = {
  path: ["/pages/giving-tuesday", "/pages/giving-tuesday/", "/pages/giving-tuesday.html"],
};
