# Ordered Journey Architecture

Bruin AI Quest v0.3 separates **fuzzy intent classification** from **deterministic journey execution**.

## Why

A ranked list answers “what might help?” but not “what should I do first, what comes next, and why?” The journey layer turns a broad goal into auditable milestones without asking a language model to invent the exact workflow.

## Decision boundary

classifier.dev / Jev answers two fuzzy questions relevant to the journey:

- which single resource is the strongest immediate match;
- which journey archetype best matches the goal.

The current journey archetypes are:

- `ai_agent_builder`
- `single_cell_research`
- `coding_project`
- `gpu_compute`
- `literature_review`
- `model_api_exploration`
- `cloud_learning`
- `general_ai`

The deterministic rules backend returns the same schema for offline tests and fallback operation.

## Deterministic expansion

`resources/journey_templates.json` owns the ordered steps. Each step records:

- resource ID;
- purpose;
- concrete milestone action;
- optional status;
- alternatives where relevant.

`src/bruin_ai_quest/journeys.py` validates those references against the resource catalogs and expands each step with world, status, official source, and location metadata. If Jev's strongest immediate resource is not already in the chosen template, it can be inserted as an **optional detour** rather than silently rewriting the canonical sequence.

## Two-world movement

A journey can cross the UCLA Campus and Online AI District. The browser treats a world change as an explicit portal transition. Campus movement stays on the campus graph; online movement stays on the shop/street graph. The model never controls frame-by-frame movement.

## Progress

Journey progress is browser-local only. The client stores the active journey, current step, completed step indexes, and the user's goal in `localStorage` so a page refresh resumes the same milestone. Reset removes that browser-local state.

No journey state is stored globally on the server, which avoids the cross-visitor leakage issue found in the v0.1 review.

## Example

```text
Goal: learn AI, build an agent, and run it on a GPU

1. QCBio AI Agents Workshop
2. GitHub Student Developer Pack
3. GitHub Codespaces
4. Hugging Face Hub
5. BruinCloud
6. OpenRouter
```

The sequence is a learning/building pathway, not a claim that every step is mandatory or that a provider is endorsed by UCLA. Availability, eligibility, cost, and data terms remain governed by the linked official source.
