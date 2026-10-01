import { createPublicKey, verify as verifySignature } from "node:crypto";
import { execFileSync } from "node:child_process";
import { canonicalJson, resolveSafeRepositoryPath } from "./publication-shared.mjs";
import { sha, validateCanonicalPng } from "./partner-logo-contract.mjs";

export const BATCH_ID = "grant-season-partners-2026-09";
export const PURPOSE = "partner_grant_season_execution_v1";
export const AUDIENCE = "matthewart100-sys/backpackkidz/apply_partner_grant_season_batch";
export const KEY_PATH = "publication/partner-grant-season-keys.json";
export const REGISTRY_PATH = "BackPackKidzWebsite/script.js";
export const PARTNERS_PAGE_PATH = "BackPackKidzWebsite/pages/our-partners.html";
export const EVENTS_PAGE_PATH = "BackPackKidzWebsite/pages/future-events.html";

export const ASSETS = Object.freeze({
  publix: Object.freeze({ path: "BackPackKidzWebsite/assets/partner-publix-charities-canonical.png", width: 260, height: 68 }),
  "holy-trinity": Object.freeze({ path: "BackPackKidzWebsite/assets/partner-holy-trinity-lutheran-canonical.png", width: 89, height: 120 }),
  "first-presbyterian": Object.freeze({ path: "BackPackKidzWebsite/assets/partner-first-presbyterian-canonical.png", width: 228, height: 120 }),
  leroys: Object.freeze({ path: "BackPackKidzWebsite/assets/partner-leroys-canonical.png", width: 155, height: 120 }),
  "fish-shack": Object.freeze({ path: "BackPackKidzWebsite/assets/partner-leroys-fish-shack-canonical.png", width: 181, height: 120 }),
  "matthews-moving": Object.freeze({ path: "BackPackKidzWebsite/assets/partner-matthews-moving-canonical.png", width: 120, height: 120 }),
  "studio-seven": Object.freeze({ path: "BackPackKidzWebsite/assets/partner-studio-seven-grant-season-2026-09.png", width: 120, height: 120 }),
});
const fail = (code) => { throw new Error(code); };
const require = (condition, code) => { if (!condition) fail(code); };
const exact = (object, fields, label) =>
  require(
    object &&
      Object.getPrototypeOf(object) === Object.prototype &&
      Object.keys(object).sort().join("|") === [...fields].sort().join("|"),
    `${label}_fields_invalid`
  );
const gitId = (value) => typeof value === "string" && /^[a-f0-9]{40}$/u.test(value);
const hash = (value) => typeof value === "string" && /^[a-f0-9]{64}$/u.test(value);
const token = (value) => typeof value === "string" && /^[A-Za-z0-9_-]{8,128}$/u.test(value);
const normalize = (source) => source.replace(/\r\n?/gu, "\n");

const countExact = (source, needle) => source.split(needle).length - 1;
const replaceOnce = (source, before, after, label) => {
  require(countExact(source, before) === 1, `partner_batch_${label}_source_drift`);
  return source.replace(before, after);
};
const removeOnce = (source, block, label) => replaceOnce(source, block, "", label);
const insertBeforeOnce = (source, anchor, addition, label) =>
  replaceOnce(source, anchor, `${addition}${anchor}`, label);
const charlotteAnchor = `  {
    name: "Gulf Coast Community Foundation",`;
const publixBlock = `  {
    name: "Publix Super Markets Charities",
    href: "https://publixcharities.org/",
    image: "/assets/partner-publix-charities-canonical.png",
    className: "sponsor-logo-wide",
    width: 260,
    height: 68,
  },
`;
const spagoAnchor = `  {
    name: "Spago Day Spa",`;
const churchBlocks = `  {
    name: "Holy Trinity Lutheran Church",
    href: "https://www.htlchurch.org/",
    image: "/assets/partner-holy-trinity-lutheran-canonical.png",
    className: "sponsor-logo-tall",
    width: 89,
    height: 120,
  },
  {
    name: "First Presbyterian Church of Port Charlotte",
    href: "https://fpcpc.com/",
    image: "/assets/partner-first-presbyterian-canonical.png",
    className: "sponsor-logo-wide",
    width: 228,
    height: 120,
  },
`;
const pilgrimageBlock = `  {
    name: "Pilgrimage United Church of Christ",
    href: "https://www.pilgrimageucc.org/",
    image: "/assets/sponsor-pilgrimage-ucc.png",
    className: "sponsor-logo-wide",
    width: 302,
    height: 150,
  },
`;
const riverwoodAnchor = `  {
    name: "Riverwood Golf Club",`;
const localBusinessBlocks = `  {
    name: "Leroy's Southern Kitchen & Bar",
    href: "https://www.leroyspg.com/",
    image: "/assets/partner-leroys-canonical.png",
    className: "sponsor-logo-wide",
    width: 155,
    height: 120,
  },
  {
    name: "Leroy's Fish Shack",
    href: "https://leroysfishshack.com/",
    image: "/assets/partner-leroys-fish-shack-canonical.png",
    className: "sponsor-logo-wide",
    width: 181,
    height: 120,
  },
  {
    name: "Matthews Moving",
    href: "https://matthewsmovingllc.com/",
    image: "/assets/partner-matthews-moving-canonical.png",
    width: 120,
    height: 120,
  },
`;
const samBefore = `  {
    name: "Sam's Club Port Charlotte",
    href: "https://www.samsclub.com/club/6445-port-charlotte-fl",
    image: "/assets/sams-club-port-charlotte-logo.jpg",
    className: "sponsor-logo-wide",
    width: 690,
    height: 239,
  },`;
const samAfter = `  {
    name: "Sam's Club Port Charlotte",
    href: "https://www.samsclub.com/club/6445-port-charlotte-fl",
    image: "/assets/sams-club-port-charlotte-logo.jpg",
    className: "sponsor-logo-wide",
    width: 840,
    height: 473,
  },`;
const studioBefore = `  {
    name: "Studio Seven PG",
    href: "https://studiosevenpg.com/",
  },`;
const studioAfter = `  {
    name: "Studio Seven PG",
    href: "https://studiosevenpg.com/",
    image: "/assets/partner-studio-seven-grant-season-2026-09.png",
    width: 120,
    height: 120,
  },`;
export function transformRegistry(source) {
  let result = normalize(source);
  result = insertBeforeOnce(result, charlotteAnchor, publixBlock, "publix_insert");
  result = insertBeforeOnce(result, spagoAnchor, churchBlocks, "church_insert");
  result = removeOnce(result, pilgrimageBlock, "pilgrimage_remove");
  result = insertBeforeOnce(result, riverwoodAnchor, localBusinessBlocks, "local_business_insert");
  result = replaceOnce(result, samBefore, samAfter, "sams_fix");
  result = replaceOnce(result, studioBefore, studioAfter, "studio_logo");
  result = replaceOnce(
    result,
    "live yearly total ($320 per child per school year, owner confirmed).",
    "live yearly total ($275 per child across 34 delivery weeks).",
    "sponsor_comment"
  );
  result = replaceOnce(
    result,
    "sponsorCalc.dataset.costPerChild || 320",
    "sponsorCalc.dataset.costPerChild || 275",
    "sponsor_default"
  );
  return result;
}
const partnerTodoBefore = "<!-- TODO (owner): Provide approved logo files for Nicola's Italian Kitchen and Studio Seven PG. Until then, the shared partner renderer shows their names as text fallbacks instead of broken images. -->";
const partnerTodoAfter = "<!-- TODO (owner): Provide an approved logo file for Nicola's Italian Kitchen. Until then, the shared partner renderer shows its name as a text fallback instead of a broken image. -->";
const hygieneCard = `            <article class="partner-impact-card" data-reveal>
              <span class="feature-icon" aria-hidden="true">03</span>
              <h3>Hygiene items for students</h3>
              <p>Support can help students access basic care items.</p>
            </article>
`;
const emergencyCard = `            <article class="partner-impact-card" data-reveal>
              <span class="feature-icon" aria-hidden="true">05</span>
              <h3>Emergency food support</h3>
              <p>Support can help respond when food needs increase.</p>
            </article>
`;
export function transformPartnersPage(source) {
  let result = normalize(source);
  result = replaceOnce(result, partnerTodoBefore, partnerTodoAfter, "partner_todo");
  result = replaceOnce(
    result,
    "<p>Support can help keep school-based resources available.</p>",
    "<p>Support can help keep snacks available to all students.</p>",
    "pantry_wording"
  );
  result = removeOnce(result, hygieneCard, "hygiene_remove");
  result = replaceOnce(
    result,
    '<span class="feature-icon" aria-hidden="true">04</span>\n              <h3>Reliable weekly distribution</h3>',
    '<span class="feature-icon" aria-hidden="true">03</span>\n              <h3>Reliable weekly distribution</h3>',
    "distribution_renumber"
  );
  result = removeOnce(result, emergencyCard, "emergency_remove");
  result = replaceOnce(
    result,
    '<span class="feature-icon" aria-hidden="true">06</span>\n              <h3>Community outreach events</h3>',
    '<span class="feature-icon" aria-hidden="true">04</span>\n              <h3>Community outreach events</h3>',
    "outreach_renumber"
  );
  return result;
}
const eventTodoBefore = `          <!-- TODO (owner): we are crediting these supporters in text because
               we do not have approved logo files for them. Send the official
               Rotary Club of Peace River and Leroy's Fish Shack logos (and
               their website URLs) and we can show them here and add them to
               the community partners marquee. -->`;
const eventTodoAfter = `          <!-- TODO (owner): provide the approved Rotary Club of Peace River logo
               and website URL if you want that event sponsor linked here. -->`;
const fishCardBefore = `            <article class="event-sponsor-card" data-reveal>
              <span class="event-sponsor-role">Food Provided By</span>
              <strong>Leroy's Fish Shack</strong>
              <p>
                Mr. Leroy is providing the evening's food with his compliments.
              </p>
            </article>`;
const fishCardAfter = `            <article class="event-sponsor-card" data-reveal>
              <span class="event-sponsor-role">Food Provided By</span>
              <a
                href="https://leroysfishshack.com/"
                class="sponsor-logo-link sponsor-logo-wide"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Visit Leroy's Fish Shack website"
              >
                <img src="/assets/partner-leroys-fish-shack-canonical.png" alt="" width="181" height="120" loading="lazy">
              </a>
              <strong><a href="https://leroysfishshack.com/" target="_blank" rel="noopener noreferrer">Leroy's Fish Shack</a></strong>
              <p>
                Mr. Leroy is providing the evening's food with his compliments.
              </p>
            </article>`;
const leroyCtaBefore = `            <!-- TODO (owner): if Leroy's Fish Shack has a website or Facebook
                 page you would like us to link, send it and we will add a
                 "Visit Leroy's Fish Shack" button here. -->
            <a href="/pages/our-partners.html" class="button button-secondary">See all community partners</a>`;
const leroyCtaAfter = `            <div class="button-row">
              <a href="https://leroysfishshack.com/" class="button button-primary" target="_blank" rel="noopener noreferrer">Visit Leroy's Fish Shack</a>
              <a href="/pages/our-partners.html" class="button button-secondary">See all community partners</a>
            </div>`;

export function transformEventsPage(source) {
  let result = normalize(source);
  result = replaceOnce(result, eventTodoBefore, eventTodoAfter, "event_todo");
  result = replaceOnce(result, fishCardBefore, fishCardAfter, "fish_event_card");
  result = replaceOnce(result, leroyCtaBefore, leroyCtaAfter, "fish_event_cta");
  return result;
}

export function contentManifest(files) {
  return [...files]
    .sort(([a], [b]) => a.localeCompare(b, "en"))
    .map(([path, bytes]) => ({ path, mode: "100644", sha256: sha(bytes) }));
}
export function planPartnerGrantSeasonFiles({ registry, partnersPage, eventsPage, assets }) {
  require(
    assets instanceof Map && assets.size === Object.keys(ASSETS).length,
    "partner_batch_assets_invalid"
  );
  const files = new Map();
  files.set(REGISTRY_PATH, Buffer.from(transformRegistry(registry)));
  files.set(PARTNERS_PAGE_PATH, Buffer.from(transformPartnersPage(partnersPage)));
  files.set(EVENTS_PAGE_PATH, Buffer.from(transformEventsPage(eventsPage)));

  for (const [id, definition] of Object.entries(ASSETS)) {
    const bytes = assets.get(id);
    require(Buffer.isBuffer(bytes), "partner_batch_asset_missing");
    validateCanonicalPng(bytes, definition.width, definition.height);
    files.set(definition.path, bytes);
  }
  return files;
}

const git = (root, args) =>
  execFileSync("git", args, {
    cwd: root,
    maxBuffer: 70000000,
    stdio: ["ignore", "pipe", "pipe"],
  });
const gitText = (root, args) => git(root, args).toString("utf8").trim();
const candidateChanges = (root, base, head) => {
  const tokens = git(
    root,
    ["diff", "--name-status", "--no-renames", "-z", base, head]
  )
    .toString("utf8")
    .split("\0")
    .filter(Boolean);
  require(tokens.length % 2 === 0, "partner_batch_diff_invalid");
  return Array.from(
    { length: tokens.length / 2 },
    (_, index) => ({
      status: tokens[index * 2],
      path: tokens[index * 2 + 1],
    })
  );
};
const readGit = (root, revision, path) =>
  git(root, ["show", `${revision}:${path}`]);
const readGitText = (root, revision, path) =>
  readGit(root, revision, path).toString("utf8");

function loadKeys(root, base) {
  const tree = gitText(root, ["ls-tree", base, "--", KEY_PATH]);
  require(
    tree.startsWith("100644 blob ") && tree.endsWith(`\t${KEY_PATH}`),
    "partner_batch_key_registry_missing"
  );
  let registry;
  try {
    registry = JSON.parse(readGitText(root, base, KEY_PATH));
  } catch {
    fail("partner_batch_key_registry_invalid");
  }
  exact(registry, ["schema", "keys"], "partner_batch_keys");
  require(
    registry.schema === "partner_grant_season_keys_v1" &&
      Array.isArray(registry.keys) &&
      registry.keys.length >= 1 &&
      registry.keys.length <= 4,
    "partner_batch_key_registry_invalid"
  );
  return registry.keys;
}
function verifyEnvelope(envelope, keys, at) {
  exact(
    envelope,
    ["schema_version", "algorithm", "key_id", "payload", "signature"],
    "partner_batch_assertion"
  );
  require(
    envelope.schema_version === 1 && envelope.algorithm === "Ed25519",
    "partner_batch_assertion_algorithm_invalid"
  );
  const matches = keys.filter(
    (key) => key.key_id === envelope.key_id && key.purpose === PURPOSE
  );
  require(matches.length === 1, "partner_batch_signer_untrusted");
  const key = matches[0];
  exact(
    key,
    ["key_id", "purpose", "public_key", "not_before", "not_after"],
    "partner_batch_public_key"
  );
  require(
    token(key.key_id) &&
      typeof key.public_key === "string" &&
      /^[A-Za-z0-9_-]{43}$/u.test(key.public_key) &&
      Number.isSafeInteger(key.not_before) &&
      Number.isSafeInteger(key.not_after) &&
      key.not_before < key.not_after,
    "partner_batch_public_key_invalid"
  );
  const payload = envelope.payload;
  require(
    Number.isSafeInteger(payload?.issued_at) &&
      Number.isSafeInteger(payload?.expires_at) &&
      key.not_before <= payload.issued_at &&
      payload.issued_at <= at &&
      at < payload.expires_at &&
      payload.expires_at <= key.not_after &&
      payload.expires_at - payload.issued_at <= 300,
    "partner_batch_grant_window_invalid"
  );

  const unsigned = { ...envelope };
  delete unsigned.signature;
  require(
    typeof envelope.signature === "string" &&
      /^[A-Za-z0-9_-]{86}$/u.test(envelope.signature),
    "partner_batch_signature_invalid"
  );
  try {
    const publicKey = createPublicKey({
      key: Buffer.concat([
        Buffer.from("302a300506032b6570032100", "hex"),
        Buffer.from(key.public_key, "base64url"),
      ]),
      format: "der",
      type: "spki",
    });
    require(
      verifySignature(
        null,
        Buffer.from(canonicalJson(unsigned)),
        publicKey,
        Buffer.from(envelope.signature, "base64url")
      ),
      "partner_batch_signature_invalid"
    );
  } catch {
    fail("partner_batch_signature_invalid");
  }
  return payload;
}
function validateGrant(grant, keys, at) {
  const payload = verifyEnvelope(grant, keys, at);
  exact(
    payload,
    [
      "purpose", "audience", "organization_id", "workspace_id", "phase",
      "execution_id", "run_id", "repository", "batch_id", "base",
      "manifest", "issued_at", "expires_at",
    ],
    "partner_batch_grant"
  );
  require(
    payload.purpose === PURPOSE &&
      payload.audience === AUDIENCE &&
      payload.organization_id === "back-pack-kidz" &&
      payload.workspace_id === "production" &&
      payload.phase === "reserved" &&
      token(payload.execution_id) &&
      token(payload.run_id) &&
      payload.repository === "matthewart100-sys/backpackkidz" &&
      payload.batch_id === BATCH_ID,
    "partner_batch_grant_identity_invalid"
  );
  exact(payload.base, ["head", "tree"], "partner_batch_base");
  require(
    gitId(payload.base.head) && gitId(payload.base.tree),
    "partner_batch_base_invalid"
  );
  require(
    Array.isArray(payload.manifest) &&
      payload.manifest.length === 3 + Object.keys(ASSETS).length,
    "partner_batch_manifest_invalid"
  );
  for (const item of payload.manifest) {
    exact(
      item,
      ["path", "mode", "sha256"],
      "partner_batch_manifest_entry"
    );
    require(
      item.mode === "100644" && hash(item.sha256),
      "partner_batch_manifest_entry_invalid"
    );
  }
  require(
    new Set(payload.manifest.map((item) => item.path)).size ===
      payload.manifest.length,
    "partner_batch_manifest_duplicate"
  );
  return payload;
}

function validateReceipt(receipt, keys) {
  exact(
    receipt,
    ["schema", "grant", "materialization"],
    "partner_batch_receipt"
  );
  require(
    receipt.schema === "partner_grant_season_receipt_v1",
    "partner_batch_receipt_schema_invalid"
  );
  const at = receipt.materialization?.payload?.materialized_at;
  require(
    Number.isSafeInteger(at),
    "partner_batch_materialization_time_invalid"
  );
  const grant = validateGrant(receipt.grant, keys, at);
  const materialization = verifyEnvelope(
    receipt.materialization,
    keys,
    at
  );
  exact(
    materialization,
    [
      "purpose", "audience", "organization_id", "workspace_id", "phase",
      "execution_id", "grant_sha256", "manifest_sha256",
      "materialized_at", "issued_at", "expires_at",
    ],
    "partner_batch_materialization"
  );
  require(
    materialization.purpose === PURPOSE &&
      materialization.audience === AUDIENCE &&
      materialization.organization_id === "back-pack-kidz" &&
      materialization.workspace_id === "production" &&
      materialization.phase === "materialized" &&
      materialization.execution_id === grant.execution_id &&
      materialization.grant_sha256 ===
        sha(Buffer.from(canonicalJson(receipt.grant))) &&
      materialization.manifest_sha256 ===
        sha(Buffer.from(canonicalJson(grant.manifest))) &&
      materialization.materialized_at === at,
    "partner_batch_materialization_binding_invalid"
  );
  return grant;
}
export function validatePartnerGrantSeasonCandidate(root, { base, head }) {
  require(
    gitId(base) &&
      gitId(head) &&
      gitText(root, ["rev-parse", "HEAD"]) === head,
    "partner_batch_candidate_identity_invalid"
  );
  try {
    git(root, ["merge-base", "--is-ancestor", base, head]);
  } catch {
    fail("partner_batch_candidate_base_invalid");
  }

  const changes = candidateChanges(root, base, head);
  const receiptPath =
    `publication/audit/partner-grant-season-${BATCH_ID}.json`;
  const batchSpecificPaths = new Set([
    EVENTS_PAGE_PATH,
    ...Object.values(ASSETS).map((value) => value.path),
  ]);
  const touched =
    changes.some(({ path }) => path === receiptPath) ||
    changes.some(({ path }) => batchSpecificPaths.has(path));
  if (!touched) return null;

  const receiptChange = changes.find(({ path }) => path === receiptPath);
  require(
    receiptChange?.status === "A",
    "partner_batch_receipt_missing"
  );
  const keys = loadKeys(root, base);
  let receipt;
  let rawReceipt;
  try {
    rawReceipt = readGitText(root, head, receiptPath);
    receipt = JSON.parse(rawReceipt);
  } catch {
    fail("partner_batch_receipt_json_invalid");
  }
  require(
    rawReceipt === canonicalJson(receipt) + "\n",
    "partner_batch_receipt_noncanonical"
  );
  const grant = validateReceipt(receipt, keys);
  const baseTree = gitText(root, ["rev-parse", `${base}^{tree}`]);
  require(
    grant.base.head === base && grant.base.tree === baseTree,
    "partner_batch_receipt_base_invalid"
  );

  const assets = new Map(
    Object.entries(ASSETS).map(([id, definition]) => [
      id,
      readGit(root, head, definition.path),
    ])
  );
  const files = planPartnerGrantSeasonFiles({
    registry: readGitText(root, base, REGISTRY_PATH),
    partnersPage: readGitText(root, base, PARTNERS_PAGE_PATH),
    eventsPage: readGitText(root, base, EVENTS_PAGE_PATH),
    assets,
  });
  const manifest = contentManifest(files);
  require(
    canonicalJson(manifest) === canonicalJson(grant.manifest),
    "partner_batch_manifest_mismatch"
  );
  files.set(
    receiptPath,
    Buffer.from(canonicalJson(receipt) + "\n")
  );
  require(
    changes.length === files.size &&
      changes.every(
        ({ path, status }) =>
          files.has(path) && ["M", "A"].includes(status)
      ),
    "partner_batch_unintended_diff"
  );

  for (const [path, bytes] of files) {
    const mode = gitText(root, ["ls-tree", head, "--", path]);
    require(
      mode.startsWith("100644 blob "),
      "partner_batch_mode_invalid"
    );
    require(
      readGit(root, head, path).equals(bytes),
      "partner_batch_bytes_mismatch"
    );
    resolveSafeRepositoryPath(root, path, { requireFile: true });
  }

  return {
    status: "passed",
    mode: "partner-grant-season-candidate",
    batchId: BATCH_ID,
    head,
    headTree: gitText(root, ["rev-parse", `${head}^{tree}`]),
    changedFiles: [...files.keys()],
  };
}

export {
  validateGrant as validatePartnerGrantSeasonGrant,
  validateReceipt as validatePartnerGrantSeasonReceipt,
};