# Security notes

This is a static portfolio plus one small booking API (`api/`, Vercel serverless) that talks to Google Calendar.
There are no user accounts, passwords, admin pages, database or payment data, so those protections do not apply.

## What protects the site now
- **Secrets** live only in Vercel environment variables (`BOOKING_SCRIPT_URL`, `BOOKING_SCRIPT_KEY`, or the three `GOOGLE_*` values). Nothing secret is in the code or in git history (all branches scanned).
- **Booking API**: same-site check, per-visitor and overall rate limits, one plain email address only (no comma/semicolon lists), no links or markup in name/note, slot must be a real open slot, generic error messages, `no-store` caching, no CORS headers (other websites cannot read responses).
- **Browser**: Content-Security-Policy (no third-party scripts, no framing, no plugins, YouTube is the only embed), `nosniff`, `X-Frame-Options`, referrer and permissions policies, HSTS. All in `vercel.json`.
- **XSS**: no user-supplied text is ever written into the page as HTML. Slot buttons and the reel player are built with DOM calls, YouTube ids are validated.
- **three.js** is served from this site (`js/vendor`) instead of a public CDN.
- Files that are not part of the site (`apps-script/`, setup docs, the unused `assets/videos/`) return 404 on the live site.

## Things only the owner can do (cannot be done from code)
1. **Revoke any GitHub token that was ever pasted into a chat or message**, then make a new one with only the repo access needed.
2. In Vercel: confirm the variables above exist only there, set `BOOKING_SCRIPT_KEY` to a long random string, and add a **Firewall rate-limit rule** for `/api/*` (the in-code limiter is per server instance, so it slows abuse but is not a hard cap).
3. Re-paste `apps-script/Code.gs` into script.google.com and redeploy so its extra checks take effect (keep your real `KEY`, never commit it).
4. GitHub: turn on two-factor authentication, secret scanning and push protection for each repository, and branch protection for `master`.

## Known limits
- The CSP still allows `'unsafe-inline'` for scripts and styles because the pages use inline `<script>`/`<style>`. Moving them into files would allow a stricter policy.
- Booking invites are emailed from the owner's Google account to the address the visitor types. Link filtering, rate limits and a Firewall rule reduce abuse; they cannot remove it entirely.
