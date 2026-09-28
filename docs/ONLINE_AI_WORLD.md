# Online AI District

The Online AI District is a separate visual and data domain from the UCLA Campus. It represents independently operated services that a UCLA student or researcher may choose to use. It is not an official UCLA service directory or endorsement.

## District architecture

The world reuses the small-room / workstation pattern from the earlier simulation prototype: resources are rendered as clickable shops inside six purpose-built districts, with a central street and a Start Portal.

| District | Resources | Purpose |
| --- | --- | --- |
| Student Benefits Arcade | GitHub Student Pack, Azure for Students, JetBrains Student Pack | Verified-student benefits and developer tooling. |
| Learning + Credits School | Google Cloud Skills, Google Cloud Education credits, AWS Educate | Training, labs, and provider-controlled education credit paths. |
| Notebook Studio Row | Colab, Kaggle Notebooks, Lightning AI Studio | Interactive notebooks and entry-level cloud/accelerator work. |
| GPU + Dev Cloud Dock | Modal, GitHub Codespaces | Cloud execution, GPU workloads, and reproducible development environments. |
| Open Model Library | Hugging Face Hub | Models, datasets, licenses, gates, and demo spaces. |
| Model API Market | OpenRouter, GroqCloud, Gemini API, Workers AI, OpenAI API, Claude API | Hosted model APIs and model-routing choices. |

## Navigation model

Two graphs intentionally remain separate:

1. **Relevance graph:** each catalog record has deterministic `properties.next_steps`. It describes useful next resources, not provider partnerships.
2. **Movement graph:** the browser expands the selected relevance path onto fixed district gates and streets. This prevents the avatar from cutting through rooms while keeping the visible journey tied to the recommendation graph.

The decision backend chooses a destination from the catalog. It does not control frame-by-frame movement, create accounts, move data, or call any resource provider.

## Evidence and boundaries

Every entry records an official provider URL and `last_verified` date. Access, student eligibility, credits, prices, model availability, quotas, retention, and acceptable-use requirements are provider-controlled and can change. Do not enter sensitive research data, credentials, PHI, or restricted UCLA data without verifying provider and institutional requirements.

Provider-specific claims are deliberately narrow. For example, Google learning credits remain distinct from instructor/course-provisioned Google Cloud credits; AWS Educate does not receive a fixed-credit promise; free GPU/notebook offers are described as quota-dependent where the provider says so.

The source list and maintenance policy are in [DATA_SOURCES.md](../DATA_SOURCES.md).
