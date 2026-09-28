# Security Policy

## Reporting a vulnerability

Please use GitHub's private security-advisory workflow for this repository:

https://github.com/sureshpatel66/bruin-ai-quest/security/advisories/new

Do **not** open a public issue containing an unpatched vulnerability, credentials, private user data, or exploit details.

## Data handling

Bruin AI Quest is designed for general resource-navigation goals, not confidential data. The public journey endpoint accepts only a bounded goal string. It does not accept arbitrary profile objects, files, credentials, PHI, restricted research data, or institutional secrets.

Goals submitted to the hosted app are sent to classifier.dev when the classifier backend is available. Use general descriptions only. Browser journey progress is stored locally in the browser and is not persisted by the server.

The production endpoint applies best-effort per-client and per-instance rate limits. Because the public deployment uses serverless infrastructure, these application-level limits are defense-in-depth rather than a substitute for provider-level abuse protection.

## Supported version

Only the current production release receives security fixes.
