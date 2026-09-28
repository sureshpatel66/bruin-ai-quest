# Westwood campus map

Verified: 2026-09-27. Community-built resource placements; not an official UCLA map or service.

## Official maps

- [UCLA interactive campus map](https://map.ucla.edu/)
- [Facilities Management map downloads](https://map.ucla.edu/downloads/)
- [Full campus PDF](https://map.ucla.edu/downloads/pdf/UCLA_Campus_Colored_Map.pdf)

The pixel map covers the main Westwood campus area, including the Hill, north/south campus, athletics and the medical area, plus surrounding streets. It is not a map of every UCLA satellite property. It does not assert a campus ownership boundary.

## Verified resource placements

| Resource | Venue | Room | Source |
| --- | --- | --- | --- |
| QCBio AI Agents | Boyer Hall | 529 | [Workshop](https://qcb.ucla.edu/collaboratory/workshops/w19-ai-agents/) |
| QCBio Single-Cell RNA-Seq with R | Boyer Hall | 130 | [Workshop](https://qcb.ucla.edu/collaboratory/workshops/w20-single-cell-rna-seq/) |
| QCBio Large Language Model Workshop | Boyer Hall | 529 | [Workshop](https://qcb.ucla.edu/collaboratory/workshops/w37-large-language-models/) |
| GitHub Copilot 101 for Students | James West Alumni Center | Founders Room | [Student events](https://dts.ucla.edu/tags/ai-exchange-students) |
| AWS Kiro Hands-On Workshop | Engineering V | 2101 | [Event](https://dts.ucla.edu/events/aws-kiro-presentation-hands-workshop) |

Kiro is October 14, 2026, **3:30–4:30 p.m. Los Angeles time**, correcting the previous registry entry. QCBio rooms differ by workshop; the single-cell workshop is not in room 529. Verify individual pages again before attendance.

UCLA AI Exchange is a multi-venue program. Its two map links represent the student events in this 17-resource catalog, not the full program. The other 11 entries are online services: no physical building is assigned to Gemini, NotebookLM, Education Plus, Gemini Workspace, Microsoft Copilot, GitHub Copilot, Kiro, BruinCloud, AI Gateway, ChatGPT Edu or Claude. Online does not mean available: existing eligibility and rollout statuses remain visible.

## Geometry and attribution

Buildings, streets, paths and selected green areas are a 2026-09-27 snapshot from the public OpenStreetMap map API. Geometry is **© OpenStreetMap contributors, ODbL 1.0**, separate from the repository's MIT code license. See [license/attribution](https://www.openstreetmap.org/copyright). The derived database is `web/assets/campus-map.json`; it retains source way IDs, graph node IDs, bounding box, retrieval date and SHA-256 hashes of input extracts. No OSM contributor account metadata is copied.

The UCLA official maps are linked as reference sources; their artwork has not been copied. Venue assignments come from official UCLA pages. Building positions/footprints come from OSM. Pixels are projected north-up with local longitude scale correction. Pin positions are approximate building centers, not room entrances.

The source extracts can be fetched using `https://www.openstreetmap.org/api/0.6/map?bbox=WEST,SOUTH,EAST,NORTH` with these four boxes:

```text
-118.459,34.0635,-118.4475,34.07175
-118.4475,34.0635,-118.436,34.07175
-118.459,34.07175,-118.4475,34.08
-118.4475,34.07175,-118.436,34.08
```

Save extracts outside the repository; then run:

```bash
.venv/bin/python scripts/build_campus_map.py /tmp/bruin-campus-{0,1,2,3}.osm
```

A later download can differ from the snapshot. The committed derived data is the exact input for the current app and tests. The application requires no map API key, CDN, live tile requests, or external map dependency to render this snapshot.

## Code and behavior

- `scripts/build_campus_map.py` projects source geography and builds a pedestrian graph while excluding explicitly private/prohibited ways.
- `web/navigation.mjs` implements deterministic A* over source node connections, with snapping to the largest connected network.
- `web/campus-map.mjs` renders the pixel map, venue buttons, pan/zoom and walking sprite. The base map is cached on a separate canvas.
- `web/app.mjs` presents resource/venue details, calls the interchangeable decision backend and renders text with DOM nodes.
- `resources/ucla_ai_resources.json` owns resource-to-venue relationships and location provenance independently of rendering and routing judgments.

Avatar routes are illustrative. The network can include stairs and does not model current closures, access hours, construction, indoor room access or accessibility. The app links UCLA's official accessibility maps and makes no accessible-navigation claim. Disconnected paths return an empty route.

Both API entry points now create a fresh routing object for each request, so map users do not inherit another visitor's profile/history. `/api/state` returns the untouched initial state. Server-side raw-goal logging in `sim.py` remains an existing limitation; this change is not a comprehensive privacy/security audit.

## Validation

```bash
.venv/bin/python -m pytest -q
node --test tests/test_navigation.mjs
```

Tests cover resource-location completeness, online resources without physical pins, both API entry points, request isolation, static assets, venue reachability and no fabricated route for disconnected nodes. Desktop/mobile browser checks cover venue selection, room display, online selection, full-campus reset and live resource routing.
