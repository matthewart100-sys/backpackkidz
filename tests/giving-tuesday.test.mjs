import assert from "node:assert/strict";
import test from "node:test";
import { campaignEndsAt } from "../BackPackKidzWebsite/giving-tuesday.js";
import serveCampaign, { config } from "../netlify/edge-functions/giving-tuesday.js";

test("all campaign URLs serve the campaign through the last moment of December 1 in Florida", async (t) => {
  assert.equal(new Date(campaignEndsAt).toISOString(), "2026-12-02T05:00:00.000Z");
  t.mock.method(Date, "now", () => campaignEndsAt - 1);
  assert.deepEqual(config.path, ["/pages/giving-tuesday", "/pages/giving-tuesday/", "/pages/giving-tuesday.html"]);
  for (const path of config.path) {
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
  for (const path of config.path) {
    const url = new URL(path, "https://www.backpackkidz.com");
    const response = await serveCampaign(new Request(url), { next: assert.fail });
    assert.equal(response.status, 302);
    assert.equal(response.headers.get("location"), new URL("/pages/donate", url).href);
    assert.equal(response.headers.get("cache-control"), "no-store");
  }
});
