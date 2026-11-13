import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const readPage = (path) => readFileSync(new URL(`../BackPackKidzWebsite/${path}`, import.meta.url), "utf8");

test("food guidelines request individually wrapped snacks without the superseded avoid list", () => {
  const html = readPage("pages/programs.html");
  const guidelines = html.match(/<section[^>]+aria-labelledby="guidelines-title"[\s\S]*?<\/section>/)?.[0];
  assert.ok(guidelines, "food guidelines section exists");
  assert.match(guidelines, /Individually wrapped snacks/);
  assert.doesNotMatch(guidelines, /Please avoid|checklist-avoid|Peanut butter|Fruit cups/);
});

test("food FAQ answer and structured data use the same updated donation guidance", () => {
  const html = readPage("pages/faq.html");
  const data = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  const question = data.mainEntity.find((entry) => entry.name === "What food can I donate?");
  assert.equal(question.acceptedAnswer.text, "Please donate individually wrapped snacks.");
  const visible = html.match(/<h3>What food can I donate\?<\/h3>([\s\S]*?)<\/article>/)[1];
  assert.match(visible, /Please donate individually wrapped snacks\./);
  assert.doesNotMatch(visible, /Please avoid|peanut butter|fruit cups/);
});

test("home partner introduction recognizes existing partners instead of unavailable details", () => {
  const html = readPage("index.html");
  assert.doesNotMatch(html, /This section is ready for|named partners when those details are available/);
  assert.match(html, /View Our Partners/);
});
