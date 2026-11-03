# Back Pack Kidz Agent Instructions

## Scope

These instructions apply to AI and automated engineering agents working in this repository. They are the tool-agnostic entry point for Codex, Work, and other agents.

`CLAUDE.md` contains the detailed project handbook and must be read before substantive work. These instructions summarize the highest-priority invariants and execution rules; they do not replace `CLAUDE.md`.

## Project identity and source of truth

This repository contains the production Back Pack Kidz website and Netlify Functions backend.

The canonical repository is the repository root. Do not commit from the stale nested `BackPackKidzWebsite/.git` repository.

The default branch is production-coupled: a push to `main` can trigger a Netlify production deploy. Treat branch publication and deployment as consequential external actions.

Before substantive work, read:

1. `CLAUDE.md`
2. `package.json`
3. `netlify.toml`
4. `.env.example`
5. relevant files under `BackPackKidzWebsite/`, `netlify/`, `tests/`, and `scripts/`

Then inspect the current branch, `HEAD`, worktree state, and relevant pull request or issue when applicable.

## Architecture

- Frontend: static HTML/CSS/JS under `BackPackKidzWebsite/`.
- Shared CSS: `BackPackKidzWebsite/style.css`.
- Shared browser JS: `BackPackKidzWebsite/script.js`.
- Backend: Netlify Functions under `netlify/functions/`.
- Durable submission data: Netlify Blobs, with fail-soft email and Google Sheets integrations.
- Payments: PayPal-hosted flow; the site must never collect card data.
- `netlify.toml` owns publish/functions paths, API rewrites, and legacy redirects.

Do not introduce a frontend framework, bundler, tracker, heavy dependency, or broad redesign unless the task explicitly requires it and the owner approves the change.

## Nonprofit facts and trust boundary

Do not invent organization facts, legal claims, tax language, EIN, board or leadership names, phone numbers, partner/sponsor status, testimonials, impact statistics, or financial claims.

When a real-world fact is unknown, preserve an existing TODO or add an owner-verification TODO rather than guessing.

Never expose or infer private information about individual children.

Treat donor and form-submission data as sensitive.

## Donation and form invariants

- PayPal is the payment processor. Do not collect or store card numbers.
- `paypal-ipn.js` is the only code path that may mark a donation Completed, and only after verified PayPal IPN handling.
- Do not present form submission as payment success.
- Do not weaken export-token checks or create unauthenticated donor-record access.
- Preserve server-side validation, client error mapping, hidden-by-default success/error UI, and accessibility wiring.
- Preserve fail-soft behavior: durable Blobs persistence is the hard requirement; notification email and Sheets mirroring must not block the user when unavailable.
- Do not rename form field contracts or endpoints casually because HTML, shared JS, functions, exports, and Sheets may depend on them.

## Frontend invariants

Preserve the current visual direction unless the task explicitly requests design changes.

Use existing design tokens and components. Do not place gradient tokens in CSS properties that accept only colors.

Preserve:

- semantic structure and heading order,
- skip links and focus-visible styles,
- ARIA state and form relationships,
- keyboard behavior,
- reduced-motion handling,
- mobile responsiveness,
- donation CTA prominence,
- extensionless sitemap/canonical conventions,
- existing redirect ordering unless a redirect change is the task.

Shared navigation/footer changes must be applied consistently across duplicated page markup, including `404.html` where applicable.

## Security and secrets

Never commit or expose SMTP credentials, Google service-account keys, API keys, export tokens, PayPal secrets, OAuth credentials, MFA material, or other secrets.

Secrets belong in Netlify environment variables and may be documented only as names/placeholders in `.env.example`.

Never log donor PII or secrets to the browser console, build output, tests, or PR text.

## Validation

Use the repository scripts as the source of truth.

Canonical checks:

- `npm run build`
- `npm test`
- `npm run check`

`npm run check` runs the build, tests, link checks, accessibility checks, responsive checks, and security checks.

For backend/function changes, run `npm test` at minimum and use `netlify dev` for local behavior that requires the Netlify runtime.

For visual changes, verify representative mobile/tablet/desktop widths and preserve reduced-motion behavior. Check touched pages for console errors, broken links, heading/metadata regressions, focus behavior, and layout overflow.

After deployment, live verification is a separate state from local validation. Do not claim production is verified until the actual Netlify deploy and changed live pages/endpoints are checked.

## Git and deployment boundary

Local branches, edits, tests, and local commits may be used when authorized by the current task.

Do not push to `main`, merge a pull request, change Netlify production configuration, alter DNS, publish content, or otherwise trigger/modify production unless that external action is explicitly authorized under the user's current permission rules.

Because `main` is production-coupled, "merged" and "deployed" may happen closely together but must still be reported as separate states and verified independently.

## Working style

- Inspect before editing; do not trust stale memory.
- Make the smallest safe change.
- Preserve unrelated user/contributor work.
- Do not reformat whole files unnecessarily.
- Prefer existing classes, utilities, and patterns before creating new ones.
- Use background/non-focus-stealing methods when practical.
- Do not make the user relay repetitive terminal output when available tools can inspect it directly.
- Do not enter endless review/fix loops; fix validated defects, rerun the relevant checks, and stop when acceptance criteria pass.

## Completion standard

A task is not complete merely because code was written.

Report exact state using terms such as implemented, tested, committed, pushed, PR opened, merged, deployed, and verified live.

If blocked, state the exact blocker, evidence, attempted alternatives, and the smallest user action required.
