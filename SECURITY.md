# Security

## Implemented controls

- Salted scrypt password hashes with constant-time comparison; verification/reset tokens are random, hashed at rest, expiring and consumed atomically. Login/reset/register routes have Redis-backed limits. Public profiles omit password hashes, email addresses and session fields.
- Browser sessions use opaque, hashed tokens in HttpOnly, SameSite=Lax cookies; Secure is enabled in production. Mobile stores access/refresh credentials in Expo SecureStore. JWTs last 15 minutes, identify a server-side session and are checked against revocation/suspension on every authenticated request. Refresh rotation uses a compare-and-set update and detects immediate predecessor reuse.
- OIDC uses state, nonce, a server PKCE verifier, verified Google email, issuer/audience/signature checks and a registered redirect. Existing email accounts are not silently linked. Mobile returns a one-use exchange code bound to a client PKCE challenge. Google requires operator credentials and live verification before release.
- State-changing browser requests require an exact allowed Origin. Cross-origin preflights use an explicit allowlist. Session cookies without an Origin cannot mutate through the API. Bearer clients do not rely on ambient browser credentials.
- Strict Zod input schemas, bounded pagination/upload limits, parameterized PostgreSQL queries, ownership and platform/team RBAC checks. Admin controls are enforced by the API, not just hidden in the UI.
- Private account posts require accepted follows; blocks restrict visibility and messaging in both directions. Collections/saves are scoped to the owner. Conversation reads/writes require membership and message-request acceptance. Socket tickets are single-use and expire after 30 seconds; delivery and typing revalidate the bound session.
- Uploads start in a private incoming directory or R2 bucket. File limits, actual image/video parsing, dimensions and duration are checked by the worker. Incoming bytes are not served by the local static route. FFmpeg network protocols are restricted; subprocess arguments are arrays, with output/time bounds.
- Web responses use a per-request nonce CSP, frame restrictions and safe URL handling. React renders user text without raw HTML. Uploaded SVG/HTML is not accepted. API errors expose a request ID, not raw stack traces. Logs omit request bodies, cookies, tokens and query strings.
- `investment_module` cannot be enabled through admin APIs; there are no investment endpoints.

## Explicit production release gates

This implementation still needs an independent security review. These are concrete current limits, not claims of completed hardening:

1. Production requires private R2 buckets and the authenticated media Worker. API visibility checks gate fresh playback links; the Worker verifies HMAC signatures before every edge-cache lookup. Live Cloudflare integration still needs staging verification. Links are bearer capabilities valid for 15 minutes, so ACL changes block new links but do not instantly revoke an existing one. Keep both buckets private; do not add a public bucket custom domain. Local static media is development-only.
2. Apply an actual malware scanner/provider and isolation policy for untrusted media. Sharp/FFmpeg format validation is not antivirus. Production Docker uses distribution FFmpeg; keep images and codecs patched. Constrain worker memory, CPU, network and disk.
3. Refresh replay tracking stores the immediate previous hash; older rotations are rejected but do not provide an unlimited historical family-reuse audit. Add refresh history for stronger family compromise handling.
4. Account deletion requires a password; Google-only accounts need a recent-provider-authentication deletion flow. Media object deletion/retention after account removal needs a complete storage lifecycle policy. Backups and audit retention need documented operational handling.
5. Configure TLS, explicit proxy trust, PostgreSQL/Redis private networking, secrets rotation, bucket/CORS policies, provider credentials and a tested disaster-recovery plan. No operator MFA or passkey flow is included.
6. Finish device-aware abuse limits, spam heuristics, bot defenses, security load/fault tests and dependency review before broad public registration.

## Dependency audit — 20 October 2026

After upgrading Next.js, Nodemailer, Sharp and affected transitive packages, `pnpm audit --prod` reports **2 high and 1 moderate advisory**, with no fixed versions listed by the registry at the time of this check. Audit exits nonzero; this is not a clean audit or a production security certification.

| Dependency       | Severity / advisory                                                                                  | Installed dependency path                                                                                                  |
| ---------------- | ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| node-forge 1.4.0 | High: [RSA signature verification](https://github.com/advisories/GHSA-86w9-cpqp-85rv)                | mobile → expo → @expo/cli → node-forge                                                                                     |
| braces 3.0.3     | High: [nested-pattern stack exhaustion](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm)           | mobile → expo → @expo/metro → metro-file-map → micromatch → braces                                                         |
| sprintf-js 1.0.3 | Moderate: [unbounded precision denial of service](https://github.com/advisories/GHSA-hp3w-g68c-fv3c) | mobile → react-native → babel-jest → babel-plugin-istanbul → @istanbuljs/load-nyc-config → js-yaml → argparse → sprintf-js |

The observed paths are in the mobile CLI/build toolchain, not the API request path. That narrows the observed exposure but does not eliminate the findings. Keep build services private, avoid processing untrusted projects/patterns/certificates with these tools, and upgrade or remove affected dependency paths when upstream fixes are available. Re-run the audit before public release; the audit does not cover FFmpeg, OS images or every vulnerability. Compatibility patches for the upgraded image-size/URI decoder are documented in `patches/README.md` and verified by both native bundle exports.

## Secrets and CSP

Run `node scripts/setup-env.mjs` for independent local secrets. Production startup rejects missing/short secrets; also replace all example values. Do not use seed passwords publicly. Keep public-prefixed environment variables free of secrets. `NEXT_PUBLIC_UPLOAD_ORIGINS` adds space-separated R2 upload and media Worker origins to CSP `connect-src`; configure exact origins rather than a wildcard. Production HTTPS can add HSTS at the trusted ingress. Inline styles are allowed for intentional runtime layout/progress values, while scripts require a nonce.

## Incident response

Suspend the affected account and revoke its sessions through audited admin actions. Rotate leaked provider credentials at their provider, preserve sanitized request IDs/audit records, inspect queued work and private storage access, and recover from a tested backup if necessary. Disable registration at ingress during an active abuse incident if application limits are insufficient. Security reports belong with the project operator; no public reporting mailbox has been invented.
