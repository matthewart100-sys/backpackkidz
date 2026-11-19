import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import test from "node:test";
import { campaignEndsAt } from "../BackPackKidzWebsite/giving-tuesday.js";
import serveCampaign, { config } from "../netlify/edge-functions/giving-tuesday.js";

const campaignPaths = ["/pages/giving-tuesday", "/pages/giving-tuesday/", "/pages/giving-tuesday.html"];
const partnersPaths = ["/pages/our-partners", "/pages/our-partners/", "/pages/our-partners.html"];

test("all campaign URLs serve the campaign through the last moment of December 1 in Florida", async (t) => {
  assert.equal(new Date(campaignEndsAt).toISOString(), "2026-12-02T05:00:00.000Z");
  t.mock.method(Date, "now", () => campaignEndsAt - 1);
  for (const path of campaignPaths) {
    const response = await serveCampaign(new Request(new URL(path, "https://www.backpackkidz.com")), {
      next: async () => new Response("campaign", { headers: { "Content-Type": "text/html" } }),
    });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("Content-Type"), "text/html");
    assert.equal(response.headers.get("Cache-Control"), "no-store");
    assert.equal(await response.text(), "campaign");
  }
});

test("at midnight every shared campaign URL redirects to Donate without loading the campaign", async (t) => {
  t.mock.method(Date, "now", () => campaignEndsAt);
  for (const path of campaignPaths) {
    const url = new URL(path, "https://www.backpackkidz.com");
    const response = await serveCampaign(new Request(url), { next: assert.fail });
    assert.equal(response.status, 302);
    assert.equal(response.headers.get("location"), new URL("/pages/donate", url).href);
    assert.equal(response.headers.get("cache-control"), "no-store");
  }
});

test("every page loads the seasonal branding module through HTML or the scoped Partners edge route", () => {
  const root = new URL("../BackPackKidzWebsite/", import.meta.url);
  const pages = readdirSync(root, { recursive: true }).filter((path) => path.endsWith(".html"));
  for (const path of pages) {
    const html = readFileSync(new URL(path.replaceAll("\\", "/"), root), "utf8");
    if (!path.endsWith("our-partners.html")) {
      assert.match(html, /<script type="module" src="\/giving-tuesday\.js"><\/script>/u, path);
    }
  }
  assert.deepEqual(config.path, [...campaignPaths, ...partnersPaths]);
});

test("only active Partners HTML receives the campaign module", async (t) => {
  const clock = t.mock.method(Date, "now", () => campaignEndsAt - 1);
  const original = '<html><head><title>Partners</title></head><body>Partner list</body></html>';
  for (const path of partnersPaths) {
    const request = new Request(new URL(path, "https://www.backpackkidz.com"));
    const active = await serveCampaign(request, {
      next: async () => new Response(original, { headers: { "Content-Type": "text/html", ETag: '"source"' } }),
    });
    assert.equal(await active.text(), original.replace("</head>", '<script type="module" src="/giving-tuesday.js"></script></head>'));
    assert.equal(active.headers.get("Cache-Control"), "no-store");
    assert.equal(active.headers.has("ETag"), false);

    const redirect = Response.redirect(new URL("/pages/our-partners", request.url));
    assert.equal(await serveCampaign(request, { next: async () => redirect }), redirect);
  }
  clock.mock.mockImplementation(() => campaignEndsAt);
  for (const path of partnersPaths) {
    const request = new Request(new URL(path, "https://www.backpackkidz.com"));
    assert.equal(await serveCampaign(request, { next: assert.fail }), undefined);
  }
});
