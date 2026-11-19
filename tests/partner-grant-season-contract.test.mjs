import assert from "node:assert/strict";
import { generateKeyPairSync, sign } from "node:crypto";
import { execFileSync } from "node:child_process";
import {
  mkdirSync, mkdtempSync,
  rmSync, writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import test from "node:test";

import { canonicalJson, validateCandidateDiff } from "../scripts/publication-contract.mjs";
import {
  ASSETS, AUDIENCE, BATCH_ID, EVENTS_PAGE_PATH, KEY_PATH,
  PARTNERS_PAGE_PATH, PURPOSE, REGISTRY_PATH, contentManifest,
  planPartnerGrantSeasonFiles, transformEventsPage,
  transformPartnersPage, transformRegistry,
  validatePartnerGrantSeasonCandidate,
} from "../scripts/partner-grant-season-contract.mjs";
import { sha } from "../scripts/partner-logo-contract.mjs";

const sourceRoot = resolve(import.meta.dirname, "..");
const PRE_BATCH_FIXTURE_COMMIT =
  "7999e548f45feb99bfa880fdff553ee52e92aa49";
const readPreBatchFixture = (path) =>
  execFileSync(
    "git",
    ["show", `${PRE_BATCH_FIXTURE_COMMIT}:${path}`],
    {
      cwd: sourceRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }
  );
const crcTable = Array.from({ length: 256 }, (_, value) => {
  let crc = value;
  for (let n = 0; n < 8; n += 1) {
    crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
  }
  return crc >>> 0;
});
const crc32 = (data) => {
  let crc = 0xffffffff;
  for (const byte of data) crc = crcTable[(crc ^ byte) & 255] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
};
const adler32 = (data) => {
  let a = 1;
  let b = 0;
  for (const byte of data) {
    a = (a + byte) % 65521;
    b = (b + a) % 65521;
  }
  return ((b << 16) | a) >>> 0;
};
const chunk = (type, data) => {
  const kind = Buffer.from(type, "ascii");
  const body = Buffer.concat([kind, data]);
  const size = Buffer.alloc(4);
  size.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([size, body, crc]);
};
const syntheticPng = (width, height) => {
  const row = Buffer.alloc(width * 4 + 1);
  for (let x = 0; x < width; x += 1) {
    row[1 + x * 4] = 20;
    row[2 + x * 4] = 120;
    row[3 + x * 4] = 50;
    row[4 + x * 4] = 255;
  }
  const raw = Buffer.concat(Array.from({ length: height }, () => row));
  const blocks = [Buffer.from([0x78, 0x01])];
  for (let offset = 0; offset < raw.length;) {
    const length = Math.min(65535, raw.length - offset);
    const header = Buffer.alloc(5);
    header[0] = Number(offset + length === raw.length);
    header.writeUInt16LE(length, 1);
    header.writeUInt16LE(length ^ 0xffff, 3);
    blocks.push(header, raw.subarray(offset, offset + length));
    offset += length;
  }
  const adler = Buffer.alloc(4);
  adler.writeUInt32BE(adler32(raw));
  blocks.push(adler);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.set([8, 6, 0, 0, 0], 8);
  return Buffer.concat([
    Buffer.from("89504e470d0a1a0a", "hex"),
    chunk("IHDR", ihdr),
    chunk("IDAT", Buffer.concat(blocks)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
};
const envelope = (payload, privateKey, keyId = "ephemeral-batch-key") => {
  const unsigned = {
    schema_version: 1,
    algorithm: "Ed25519",
    key_id: keyId,
    payload,
  };
  return {
    ...unsigned,
    signature: sign(
      null,
      Buffer.from(canonicalJson(unsigned)),
      privateKey
    ).toString("base64url"),
  };
};
const nonCanonicalBase64url = (value) => {
  const alphabet =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
  const index = alphabet.indexOf(value.at(-1));
  assert.ok(index >= 0);
  const replacement = (index & 0b110000) | ((index + 1) & 0b001111);
  return value.slice(0, -1) + alphabet[replacement];
};
const git = (root, ...args) =>
  execFileSync("git", args, {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();

const baseRegistry = readPreBatchFixture(REGISTRY_PATH);
const basePartners = readPreBatchFixture(PARTNERS_PAGE_PATH);
const baseEvents = readPreBatchFixture(EVENTS_PAGE_PATH);
test("fixed partner batch transforms only the approved September set", () => {
  const registry = transformRegistry(baseRegistry);
  const partners = transformPartnersPage(basePartners);
  const events = transformEventsPage(baseEvents);

  for (const name of [
    "Publix Super Markets Charities",
    "Holy Trinity Lutheran Church",
    "First Presbyterian Church of Port Charlotte",
    "Leroy's Southern Kitchen & Bar",
    "Leroy's Fish Shack",
    "Matthews Moving",
  ]) {
    assert.ok(registry.includes(name), name);
  }

  assert.ok(!registry.includes("Pilgrimage United Church of Christ"));
  assert.ok(registry.includes("partner-studio-seven-grant-season-2026-09.png"));
  assert.ok(registry.includes("width: 840,\n    height: 473"));
  assert.ok(registry.includes("costPerChild || 275"));
  assert.ok(!partners.includes("Hygiene items for students"));
  assert.ok(!partners.includes("Emergency food support"));
  assert.ok(partners.includes("snacks available to all students"));
  assert.ok(events.includes("Visit Leroy's Fish Shack"));
  assert.ok(!events.includes("Rotary Club of Peace River and Leroy's Fish Shack"));
});
test("fixed batch rejects source drift instead of widening scope", () => {
  assert.throws(
    () => transformRegistry(
      baseRegistry.replace(
        "Gulf Coast Community Foundation",
        "Changed Foundation"
      )
    ),
    /publix_insert_source_drift/u
  );
  assert.throws(
    () => transformPartnersPage(
      basePartners.replace(
        "Hygiene items for students",
        "Changed heading"
      )
    ),
    /hygiene_remove_source_drift/u
  );
  assert.throws(
    () => transformEventsPage(
      baseEvents.replace("Food Provided By", "Changed role")
    ),
    /fish_event_card_source_drift/u
  );
});
test("signed exact batch passes and any extra diff fails", (t) => {
  const root = mkdtempSync(join(tmpdir(), "bpk-partner-batch-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));

  const { privateKey, publicKey } = generateKeyPairSync("ed25519");
  const now = Math.floor(Date.now() / 1000);

  for (const [path, contents] of [
    [REGISTRY_PATH, baseRegistry],
    [PARTNERS_PAGE_PATH, basePartners],
    [EVENTS_PAGE_PATH, baseEvents],
  ]) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), contents);
  }

  mkdirSync(join(root, "scripts"), { recursive: true });
  writeFileSync(
    join(root, "scripts", "publication-contract.mjs"),
    "trusted contract baseline\n"
  );
  mkdirSync(join(root, "publication"), { recursive: true });

  const keys = [{
    key_id: "ephemeral-batch-key",
    purpose: PURPOSE,
    public_key: publicKey
      .export({ format: "der", type: "spki" })
      .subarray(-32)
      .toString("base64url"),
    not_before: now - 60,
    not_after: now + 3600,
  }];
  writeFileSync(
    join(root, KEY_PATH),
    canonicalJson({
      schema: "partner_grant_season_keys_v1",
      keys,
    }) + "\n"
  );

  git(root, "init", "-b", "main");
  git(root, "config", "user.name", "Partner Batch Test");
  git(root, "config", "user.email", "partner-batch@example.invalid");
  git(root, "config", "core.autocrlf", "false");
  git(root, "add", ".");
  git(root, "commit", "-m", "base");

  const base = {
    head: git(root, "rev-parse", "HEAD"),
    tree: git(root, "rev-parse", "HEAD^{tree}"),
  };
  git(root, "switch", "-c", "event-only");
  writeFileSync(
    join(root, EVENTS_PAGE_PATH),
    baseEvents + "\n<!-- unrelated future event edit -->\n"
  );
  git(root, "add", ".");
  git(root, "commit", "-m", "ordinary future event edit");
  const eventOnlyHead = git(root, "rev-parse", "HEAD");
  assert.equal(
    validatePartnerGrantSeasonCandidate(root, {
      base: base.head,
      head: eventOnlyHead,
    }),
    null
  );
  git(root, "switch", "main");
  const assets = new Map(
    Object.entries(ASSETS).map(([id, value]) => [
      id,
      syntheticPng(value.width, value.height),
    ])
  );
  const files = planPartnerGrantSeasonFiles({
    registry: baseRegistry,
    partnersPage: basePartners,
    eventsPage: baseEvents,
    assets,
  });
  const manifest = contentManifest(files);
  const payload = {
    purpose: PURPOSE,
    audience: AUDIENCE,
    organization_id: "back-pack-kidz",
    workspace_id: "production",
    phase: "reserved",
    execution_id: "synthetic-partner-batch-0001",
    run_id: "synthetic-partner-run-0001",
    repository: "matthewart100-sys/backpackkidz",
    batch_id: BATCH_ID,
    base,
    manifest,
    issued_at: now,
    expires_at: now + 300,
  };
  const grant = envelope(payload, privateKey);
  const materialization = envelope({
    purpose: PURPOSE,
    audience: AUDIENCE,
    organization_id: "back-pack-kidz",
    workspace_id: "production",
    phase: "materialized",
    execution_id: payload.execution_id,
    grant_sha256: sha(Buffer.from(canonicalJson(grant))),
    manifest_sha256: sha(Buffer.from(canonicalJson(manifest))),
    materialized_at: now,
    issued_at: now,
    expires_at: now + 300,
  }, privateKey);
  const receipt = {
    schema: "partner_grant_season_receipt_v1",
    grant,
    materialization,
  };
  const receiptPath =
    "publication/audit/partner-grant-season-" +
    BATCH_ID +
    ".json";

  git(root, "switch", "-c", "partner-batch-candidate");
  for (const [path, bytes] of files) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), bytes);
  }
  mkdirSync(dirname(join(root, receiptPath)), { recursive: true });

  const nonCanonicalReceipt = JSON.parse(JSON.stringify(receipt));
  nonCanonicalReceipt.materialization.signature =
    nonCanonicalBase64url(
      nonCanonicalReceipt.materialization.signature
    );
  writeFileSync(
    join(root, receiptPath),
    canonicalJson(nonCanonicalReceipt) + "\n"
  );
  git(root, "add", ".");
  git(root, "commit", "-m", "non-canonical receipt encoding");
  const nonCanonicalHead = git(root, "rev-parse", "HEAD");
  assert.throws(
    () => validateCandidateDiff(root, {
      base: base.head,
      head: nonCanonicalHead,
    }),
    /partner_batch_signature_invalid/u
  );

  writeFileSync(
    join(root, receiptPath),
    canonicalJson(receipt) + "\n"
  );
  git(root, "add", ".");
  git(root, "commit", "-m", "canonical signed batch");
  const head = git(root, "rev-parse", "HEAD");

  assert.equal(
    validateCandidateDiff(root, {
      base: base.head,
      head,
    }).mode,
    "partner-grant-season-candidate"
  );

  git(root, "switch", "-c", "partner-batch-rollback");
  writeFileSync(join(root, REGISTRY_PATH), baseRegistry);
  writeFileSync(join(root, PARTNERS_PAGE_PATH), basePartners);
  writeFileSync(join(root, EVENTS_PAGE_PATH), baseEvents);
  for (const { path } of Object.values(ASSETS)) {
    rmSync(join(root, path), { force: true });
  }
  rmSync(join(root, receiptPath), { force: true });
  git(root, "add", "-A");
  git(root, "commit", "-m", "exact governed batch rollback");
  const rollbackHead = git(root, "rev-parse", "HEAD");
  assert.equal(
    validateCandidateDiff(root, {
      base: head,
      head: rollbackHead,
    }).mode,
    "partner-grant-season-rollback-candidate"
  );

  git(root, "switch", "partner-batch-candidate");
  writeFileSync(
    join(root, "unauthorized.txt"),
    "outside signed manifest\n"
  );
  git(root, "add", ".");
  git(root, "commit", "-m", "extra diff");
  const tampered = git(root, "rev-parse", "HEAD");

  assert.throws(
    () => validateCandidateDiff(root, {
      base: base.head,
      head: tampered,
    }),
    /partner_batch_unintended_diff/u
  );
});