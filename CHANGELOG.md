# Changelog

## v0.3.2 — 2026-09-27

### Dependency hardening

- Consolidated Python dependency locking on `pyproject.toml` + `uv.lock` and removed the duplicate `requirements.txt` manifest.
- CI now installs the exact lockfile with pinned `uv`, then runs tests, `pip-audit`, and Bandit inside the locked environment.
- Build tooling remains pinned above the active setuptools/wheel advisory ranges.
- Updated the public client user-agent to `bruin-ai-quest/0.3.2`.

## v0.3.1 — 2026-09-27

### Security and privacy hardening

- Removed the public arbitrary `profile` field and legacy `/api/route` and `/api/state` endpoints.
- Removed raw goal logging from application code.
- Added best-effort hashed-IP/per-instance rate limiting to the production journey endpoint.
- Production ignores a classifier workspace key unless `BRUIN_USE_CLASSIFIER_KEY=1` is explicitly enabled.
- Removed classifier exception details from public fallback responses.
- Disabled production FastAPI docs, ReDoc, and OpenAPI endpoints.
- Added CSP, clickjacking, MIME-sniffing, referrer, permissions, and cross-origin security headers.
- Added `SECURITY.md` and a `/.well-known/security.txt` endpoint.
- Pinned Python runtime dependencies and GitHub Actions revisions; added Dependabot configuration and CI security scans.
- Replaced the standard-library XML parser in the offline map builder with `defusedxml`.
- Removed the author-specific citation file and local-machine path from public documentation.
- Generalized default simulation profile fields to avoid embedding author-specific research context.

### Validation

- 22 Python tests and 7 JavaScript tests pass.
- `pip-audit`: no known vulnerabilities in the locked runtime dependency set.
- Bandit: no reported issues in `src`, `api`, or `scripts`.

## v0.3.0 — 2026-09-27

### Added

- True ordered resource journeys rather than only a best-resource recommendation plus alternatives.
- Eight journey archetypes classified by Jev: AI-agent builder, single-cell research, coding project, GPU compute, literature review, model-API exploration, cloud learning, and general AI.
- Deterministic `journey_templates.json` and `journeys.py` expansion layer with purpose, milestone action, optional steps, alternatives, world, status, and official source.
- New `POST /api/journey` endpoint for both local FastAPI and Vercel entry points.
- Cross-world portal transitions between UCLA Campus and the Online AI District.
- Interactive journey panel with ordered milestones, completion progress, previous/next navigation, optional alternatives, and reset.
- Browser-local journey persistence using `localStorage`; refresh resumes the current step without creating server-side user state.
- Journey architecture documentation and dedicated journey tests.

### Changed

- The main goal form now builds a journey by default.
- Jev's System One request now returns both the best immediate resource and a typed journey archetype in one call.
- The deterministic rules backend mirrors the journey-type schema for offline operation and CI.
- Header framing updated from “two worlds / one route” to “two worlds / one journey.”
- Goal payloads are limited to 2,000 characters at the API schema as well as the browser input.

### Validation

- Live classifier.dev / Jev 1.13 correctly classified the AI-agent + GPU example as `ai_agent_builder` and produced the canonical six-step journey.
- Cross-world UI progression tested from QCBio AI Agents → GitHub Student Developer Pack, including visible UCLA → Online portal transition.
- Refresh persistence restored the active journey and completed-step count.
- True 390px mobile viewport check confirmed zero horizontal overflow and accessible journey UI.

## v0.2.0 — 2026-09-27

### Added

- Two distinct visual worlds: geographically grounded UCLA Campus and independent Online AI District.
- Pixel-art UCLA campus renderer using OpenStreetMap-derived geometry with verified UCLA event/workshop venues.
- Online AI District with six shop districts, 18 external resources, deterministic streets, clickable rooms, and resource relevance links.
- New online resources: Azure for Students, Google Colab, Gemini API, Cloudflare Workers AI, JetBrains Student Pack, GitHub Codespaces, Kaggle Notebooks, Lightning AI Studio, OpenAI API, and Anthropic Claude API.
- Separate access, billing/offer, data-boundary, official-source, and verification metadata for external resources.
- Deep link `?world=online` for the Online AI District.
- Campus navigation tests and Online AI District layout/navigation tests.

### Changed

- Routing is stateless per request to prevent cross-visitor goal/profile leakage.
- User-provided goal text is rendered through safe DOM text nodes rather than interpolated HTML.
- Mobile layout keeps recommendations and details accessible and avoids horizontal overflow.
- AWS Kiro workshop schedule corrected to the directly verified UCLA event time.
- Resource-selection UI now clearly labels external online providers separately from UCLA-supported resources.
- Online navigation now uses small rooms/shops and fixed streets while retaining the catalog relevance graph.

### Validation

- 14 Python tests pass.
- 7 Node navigation/world tests pass.
- Headless desktop and true 390px mobile viewport checks completed.
- Live classifier.dev / Jev 1.13 routes verified for UCLA and newly added online resources.

### Boundaries

Bruin AI Quest remains a community-built project, not an official UCLA service or endorsement. Resource offers, pricing, eligibility, data terms, event rooms, and model availability can change after verification.
