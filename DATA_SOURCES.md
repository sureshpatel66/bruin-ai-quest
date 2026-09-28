# Data sources

Bruin AI Quest uses two small, manually curated registries: `resources/ucla_ai_resources.json` for UCLA/UCLA-affiliated offerings and `resources/online_ai_resources.json` for external, provider-operated tools.

The registry is **not** an authoritative UCLA directory. It is a community-built snapshot designed for demonstration and navigation. Each record carries an official source URL and a `last_verified` date. Availability, eligibility, pricing, dates, and policy can change after verification.

## Primary official sources

- UCLA DTS AI Tools catalog: https://dts.ucla.edu/products-services/ai-tools
- UCLA Campus AI Tools Comparison: https://www.dts.ucla.edu/products-services/ai-tools/campus-ai-tools-comparison
- UCLA Google AI: https://www.dts.ucla.edu/products-services/ai-tools/google-ai
- UCLA Microsoft AI: https://dts.ucla.edu/products-services/ai-tools/microsoft-ai
- UCLA OpenAI: https://www.dts.ucla.edu/products-services/ai-tools/open-ai
- UCLA AI Exchange: https://dts.ucla.edu/initiatives/ai/ucla-ai-exchange
- UCLA AI Exchange student events: https://dts.ucla.edu/tags/ai-exchange-students
- QCBio workshop schedule: https://qcb.ucla.edu/collaboratory/schedule-of-workshops/
- QCBio AI Agents workshop: https://qcb.ucla.edu/collaboratory/workshops/w19-ai-agents/

## Verification policy

Before changing a resource record:

1. Prefer an official UCLA or UCLA-affiliated source.
2. Record the current status rather than inferring future access.
3. Distinguish campus-wide student access from faculty/staff-only or project-dependent access.
4. Keep dates explicit for events and rollout windows.
5. Update `last_verified` when a record is checked.

If an official page and a third-party page disagree, the official UCLA source controls the registry.

## External Online AI World sources

External resources are not UCLA offerings or endorsements. Their records identify provider operation and include access, billing, and data-boundary guidance. Before changing an external record, prefer the provider's current documentation and preserve any qualification on eligibility, credit use, or billing.

- GitHub Student Developer Pack eligibility: https://education.github.com/pack/join
- GitHub Student Developer Pack: https://education.github.com/pack
- Google Cloud Students: https://cloud.google.com/edu/students
- Google Cloud education credits: https://cloud.google.com/billing/docs/how-to/edu-grants
- AWS Educate: https://aws.amazon.com/education/awseducate/
- Modal guide: https://modal.com/docs/guide
- OpenRouter documentation: https://openrouter.ai/docs
- Groq API quickstart: https://console.groq.com/docs/quickstart
- Hugging Face Hub documentation: https://huggingface.co/docs/hub
- Azure for Students: https://learn.microsoft.com/en-us/azure/education-hub/about-azure-for-students
- Google Colab FAQ: https://research.google.com/colaboratory/faq.html
- Gemini API pricing: https://ai.google.dev/gemini-api/docs/pricing
- Cloudflare Workers AI pricing: https://developers.cloudflare.com/workers-ai/platform/pricing/
- JetBrains Student Pack: https://www.jetbrains.com/academy/student-pack/
- GitHub Codespaces billing and included quotas: https://docs.github.com/en/billing/concepts/product-billing/github-codespaces
- Kaggle Notebooks: https://www.kaggle.com/docs/notebooks
- Lightning AI Academia: https://lightning.ai/docs/team-management/academia
- OpenAI API model documentation: https://platform.openai.com/docs/models
- Anthropic Claude Platform documentation: https://docs.anthropic.com/en/home

The catalog does not claim a fixed AWS promotion, a universal Google Cloud production credit, or a fixed model-provider price. Those offers change and are represented with the terms recorded on their official pages at verification time.

## Campus placement and geometry

Room-level venue assignments are documented in [CAMPUS_MAP.md](docs/CAMPUS_MAP.md) and each resource's `location` record. Building footprints and positions come from OpenStreetMap (ODbL), while UCLA workshop/event pages establish which resource belongs in which building. Online services have no physical pin; multi-venue programs do not imply one headquarters. Venue verification and geometry retrieval dates are tracked separately.
