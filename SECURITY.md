# Security Policy

## Supported versions

This is a personal project deployed as a single live site. Only the latest
release on the `master` branch (deployed to [luci-studio.com](https://luci-studio.com))
is maintained.

| Version | Supported |
|---------|-----------|
| Latest `master` | ✅ |
| Older releases | ❌ |

## Reporting a vulnerability

**Please do not open a public issue for security problems.**

Report privately via GitHub's [Private vulnerability reporting](https://github.com/kido-luci/luci_dev/security/advisories/new)
(Security tab → "Report a vulnerability"). If that's unavailable, you may email
the maintainer instead.

Please include:

- A description of the issue and its impact
- Steps to reproduce (or a proof of concept)
- Affected page/route or file, if known

You can expect an initial response within a few days. Once a fix is released,
the report may be publicly disclosed with credit unless you prefer otherwise.

## Scope notes

This repository contains the **frontend only** — a static Astro site that fetches
post content from a separate backend API at build time. It holds no secrets:
runtime configuration is provided via environment variables (see
[`.env.example`](./.env.example)), and `.env` files are never committed.
