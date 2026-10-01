import { resolve } from "node:path";
import { validatePartnerGrantSeasonCandidate } from "./partner-grant-season-contract.mjs";
import { validateLogoCandidate } from "./partner-logo-contract.mjs";

const root = resolve(import.meta.dirname, "..");
const candidate = {
  base: process.env.PILOT_BASE,
  head: process.env.PILOT_HEAD,
};
const batchResult = validatePartnerGrantSeasonCandidate(root, candidate);
const result =
  batchResult ??
  validateLogoCandidate(root, { ...candidate, preview: true });
console.log(JSON.stringify(result ?? { status: "not_a_logo_candidate" }));
