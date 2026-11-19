import assert from "node:assert/strict";
import test from "node:test";
import { matchesPaypalReceiver } from "../netlify/config-utils.mjs";

test("matches the configured merchant ID even when receiver_email is present", () => {
  const params = new URLSearchParams({ receiver_email: "merchant@example.org", receiver_id: "MERCHANT123", business: "OTHER" });
  assert.equal(matchesPaypalReceiver(params, { PAYPAL_BUSINESS: "MERCHANT123" }), true);
  assert.equal(matchesPaypalReceiver(params, { PAYPAL_BUSINESS: "OTHER" }), false);
});

test("explicit receiver email takes precedence and matches case-insensitively", () => {
  const env = { PAYPAL_RECEIVER_EMAIL: "Merchant@example.org", PAYPAL_BUSINESS: "MERCHANT123" };
  assert.equal(matchesPaypalReceiver(new URLSearchParams({ business: "merchant@example.org" }), env), true);
  assert.equal(matchesPaypalReceiver(new URLSearchParams({ receiver_email: "other@example.org", receiver_id: "MERCHANT123" }), env), false);
});

test("supports an email in PAYPAL_BUSINESS and preserves optional matching", () => {
  const params = new URLSearchParams({ receiver_email: "merchant@example.org" });
  assert.equal(matchesPaypalReceiver(params, { PAYPAL_BUSINESS: "MERCHANT@example.org" }), true);
  assert.equal(matchesPaypalReceiver(new URLSearchParams(), { PAYPAL_BUSINESS: "MERCHANT123" }), false);
  assert.equal(matchesPaypalReceiver(new URLSearchParams(), {}), true);
});
